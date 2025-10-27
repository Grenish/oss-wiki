import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for contributor data
const ContributorSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  type: z.string(),
  contributions: z.number(),
  last_commit_date: z.string().optional(),
});

type Contributor = z.infer<typeof ContributorSchema>;

// GitHub API headers
function ghHeaders() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "oss-wiki-app",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  } as const;
}

// Get client IP from request
function getClientIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return 'unknown';
}

// Simple in-memory rate limiter (for production, use Redis or Upstash)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function isRateLimited(ip: string): Promise<boolean> {
  const RATE_LIMIT_PER_MINUTE = parseInt(process.env.GITHUB_RATE_LIMIT_PER_MINUTE || '10', 10);
  const WINDOW_MS = 60 * 1000; // 1 minute window
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS; // Start of current window
  const key = `contributors:${ip}:${windowStart}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    // Create new record
    rateLimitStore.set(key, { count: 1, resetTime: windowStart + WINDOW_MS });
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    return false;
  }
  
  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return true; // Rate limited
  }
  
  // Increment count
  record.count += 1;
  return false;
}

// Get contributors for a specific file path
async function getContributorsForFile(
  owner: string,
  repo: string,
  filePath: string
): Promise<Contributor[]> {
  try {
    // First, get all commits for the file
    const commitsUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
    commitsUrl.searchParams.set("path", filePath);
    commitsUrl.searchParams.set("per_page", "100"); // Limit to 100 commits
    
    const commitsRes = await fetch(commitsUrl.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: ghHeaders(),
    });

    if (!commitsRes.ok) {
      const remaining = commitsRes.headers.get("x-ratelimit-remaining");
      if (commitsRes.status === 403 && remaining === "0") {
        throw new Error("GitHub API rate limit hit. Try again later.");
      }
      // If file not found, return empty array
      if (commitsRes.status === 404) {
        return [];
      }
      const body = await commitsRes.text().catch(() => "");
      throw new Error(`GitHub API ${commitsRes.status}: ${body || commitsRes.statusText}`);
    }

    const commitsData = await commitsRes.json();
    
    // Process commits to extract unique contributors
    const contributorMap = new Map<string, Contributor>();
    
    for (const commit of commitsData) {
      const author = commit.author;
      if (!author) continue;
      
      if (contributorMap.has(author.id)) {
        // Update existing contributor
        const existing = contributorMap.get(author.id)!;
        existing.contributions += 1;
        // Update last commit date if this one is more recent
        if (commit.commit.committer.date > (existing.last_commit_date || '')) {
          existing.last_commit_date = commit.commit.committer.date;
        }
      } else {
        // Add new contributor
        contributorMap.set(author.id, {
          id: author.id,
          login: author.login,
          avatar_url: author.avatar_url,
          html_url: author.html_url,
          type: author.type,
          contributions: 1,
          last_commit_date: commit.commit.committer.date,
        });
      }
    }
    
    // Convert map to array and sort by contributions (descending)
    const contributors = Array.from(contributorMap.values());
    contributors.sort((a, b) => b.contributions - a.contributions);
    
    return contributors;
  } catch (error) {
    console.error("Error fetching contributors:", error);
    throw error; // Re-throw to be handled by caller
  }
}

// GET handler for the API route
export async function GET(request: Request) {
  const clientIP = getClientIP(request);
  
  // Check rate limit
  if (await isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": "60" // Retry after 1 minute
        }
      }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const docPath = searchParams.get('docPath');
  
  // Default values - you should update these to match your actual repository
  const owner = process.env.GITHUB_OWNER || "Grenish";
  const repo = process.env.GITHUB_REPO || "oss-wiki";
  
  if (!docPath) {
    return NextResponse.json(
      { error: "docPath parameter is required" },
      { status: 400 }
    );
  }
  
  try {
    // Try the first file path
    const filePath1 = docPath.endsWith('.mdx') ? 
      `content/docs/${docPath}` : 
      `content/docs/${docPath}.mdx`;
    
    let contributors = await getContributorsForFile(owner, repo, filePath1);
    
    // If no contributors found, try the index file path
    if (contributors.length === 0) {
      const filePath2 = docPath.endsWith('.mdx') ? 
        `content/docs/${docPath.replace(/\.mdx$/, '')}/index.mdx` : 
        `content/docs/${docPath}/index.mdx`;
      
      contributors = await getContributorsForFile(owner, repo, filePath2);
    }
    
    // Return contributors with CDN caching headers
    return NextResponse.json(contributors, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' // Cache for 1 hour, stale for 30 minutes
      }
    });
  } catch (error: any) {
    console.error("API Error:", error);
    
    // Check if this is a GitHub rate limit error
    if (
      (error.status === 403) || 
      (error.message && error.message.includes('rate limit')) ||
      (error.message && error.message.includes('API rate limit exceeded'))
    ) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    // Return generic error for other failures
    return NextResponse.json(
      { error: "Failed to fetch contributors" },
      { status: 500 }
    );
  }
}