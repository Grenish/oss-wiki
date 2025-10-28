import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for contributor data
const ContributorSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  contributions: z.number(),
  last_commit_date: z.string().optional(),
});

type Contributor = z.infer<typeof ContributorSchema>;

// GitHub API headers
function ghHeaders() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github.v4+json",
    "User-Agent": "oss-wiki-app",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  } as const;
}

// Get client IP from request
function getClientIP(request: Request): string {
  const headers = request.headers;
  
  // List of headers to check in order of preference
  const headerNames = [
    'x-forwarded-for',
    'x-client-ip',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'fastly-client-ip'
  ];
  
  for (const headerName of headerNames) {
    const headerValue = headers.get(headerName);
    if (headerValue) {
      let ip = headerValue.trim();
      
      // For x-forwarded-for, take the first IP in the comma-separated list
      if (headerName === 'x-forwarded-for' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      
      // Basic validation for IPv4 or IPv6 format
      if (ip && (isValidIPv4(ip) || isValidIPv6(ip))) {
        return ip;
      }
    }
  }
  
  return 'unknown';
}

// Basic IPv4 validation
function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  // Check that each octet is between 0 and 255
  const octets = ip.split('.');
  return octets.every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

// Basic IPv6 validation
function isValidIPv6(ip: string): boolean {
  // Very basic IPv6 validation - checks for presence of colons
  // and that it doesn't look like an IPv4 address
  return ip.includes(':') && !ip.includes('.') && ip.length > 2;
}

// Rate limiter return type
type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

// Simple in-memory rate limiter (for production, use Redis or Upstash)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const RATE_LIMIT_PER_MINUTE = parseInt(process.env.GITHUB_RATE_LIMIT_PER_MINUTE || '10', 10);
  const WINDOW_MS = 60 * 1000; // 1 minute window
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS; // Start of current window
  const key = `contributors:${ip}:${windowStart}`;
  
  const record = rateLimitStore.get(key);
  const resetTime = windowStart + WINDOW_MS;
  const remainingSeconds = Math.max(0, Math.ceil((resetTime - now) / 1000));
  
  if (!record || record.resetTime < now) {
    // Create new record
    rateLimitStore.set(key, { count: 1, resetTime });
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    return { limited: false, retryAfterSeconds: remainingSeconds };
  }
  
  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return { limited: true, retryAfterSeconds: remainingSeconds }; // Rate limited
  }
  
  // Increment count
  record.count += 1;
  return { limited: false, retryAfterSeconds: remainingSeconds };
}

// Get contributors for a specific file path using GraphQL
async function getContributorsForFile(
  owner: string,
  repo: string,
  filePath: string
): Promise<Contributor[]> {
  try {
    const query = `
      query($owner: String!, $name: String!, $path: String!, $after: String) {
        repository(owner: $owner, name: $name) {
          object(expression: "HEAD") {
            ... on Commit {
              history(path: $path, first: 100, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  author {
                    user {
                      id
                      login
                      avatarUrl
                      url
                    }
                  }
                  committedDate
                }
              }
            }
          }
        }
      }
    `;

    const contributorMap = new Map<string, Contributor>();
    let hasNextPage = true;
    let endCursor: string | null = null;
    const seenLogins = new Set<string>();

    while (hasNextPage) {
      const variables = {
        owner,
        name: repo,
        path: filePath,
        after: endCursor || undefined
      };

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: ghHeaders(),
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        if (response.status === 403 && remaining === "0") {
          throw new Error("GitHub API rate limit hit. Try again later.");
        }
        // If file not found, return empty array
        if (response.status === 404) {
          return [];
        }
        const body = await response.text().catch(() => "");
        throw new Error(`GitHub API ${response.status}: ${body || response.statusText}`);
      }

      const data = await response.json();
      
      // Check for GraphQL errors
      if (data.errors) {
        const errorMessages = data.errors.map((error: { message: string }) => error.message);
        throw new Error(`GitHub GraphQL Error: ${errorMessages.join(', ')}`);
      }
      
      const history = data.data?.repository?.object?.history;
      const commits = history?.nodes || [];
      const pageInfo = history?.pageInfo || {};
      
      // Process commits for this page
      for (const commit of commits) {
        const author = commit.author?.user;
        if (!author || !author.login) continue;  // Skip if no user info
        
        const login = author.login.toLowerCase();  // Normalize login to handle case sensitivity
        
        if (seenLogins.has(login)) {
          // Update existing contributor's contribution count
          const existing = contributorMap.get(login)!;
          existing.contributions += 1;
          // Update last commit date if this one is more recent
          if (commit.committedDate > (existing.last_commit_date || '')) {
            existing.last_commit_date = commit.committedDate;
          }
        } else {
          // Add new contributor
          seenLogins.add(login);
          contributorMap.set(login, {
            id: author.id ? parseInt(author.id) : Math.floor(Math.random() * 1000000),
            login: author.login,
            avatar_url: author.avatarUrl || `https://github.com/${author.login}.png`,
            html_url: author.url || `https://github.com/${author.login}`,
            contributions: 1,
            last_commit_date: commit.committedDate,
          });
        }
      }
      
      // Check if there are more pages
      hasNextPage = pageInfo?.hasNextPage || false;
      endCursor = pageInfo?.endCursor || null;
      
      // If we've processed a lot of commits, break to prevent rate limiting
      if (contributorMap.size > 100) {
        console.warn('Processed 100+ contributors, stopping to prevent rate limiting');
        break;
      }
    }
    
    // Convert map to array and sort by contributions (descending)
    const contributors = Array.from(contributorMap.values());
    contributors.sort((a, b) => b.contributions - a.contributions);
    
    return contributors;
  } catch (error) {
    console.error("Error fetching contributors:", error);
    throw error;
  }
}

// GET handler for the API route
export async function GET(request: Request) {
  // Check if GitHub token is configured
  if (!process.env.GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN not configured, returning empty contributors list");
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });
  }
  
  const clientIP = getClientIP(request);
  
  // Check rate limit
  const rateLimitResult = await checkRateLimit(clientIP);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.retryAfterSeconds.toString()
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', // Cache for 1 hour, stale for 30 minutes
        "Retry-After": rateLimitResult.retryAfterSeconds.toString()
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