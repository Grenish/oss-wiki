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
      const body = await commitsRes.text().catch(() => "");
      throw new Error(`GitHub API ${commitsRes.status}: ${body || commitsRes.statusText}`);
    }

    const commitsData = await commitsRes.json();
    
    // Process commits to extract unique contributors
    const contributorMap = new Map<number, Contributor>();
    
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
    throw error;
  }
}

// GET handler for the API route
export async function GET(request: Request) {
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
  
  // Convert documentation path to file path
  // Example: get-started/1-git-and-github -> content/docs/get-started/1-git-and-github.mdx
  const filePath = docPath.endsWith('.mdx') ? 
    `content/docs/${docPath}` : 
    `content/docs/${docPath}.mdx`;
  
  try {
    const contributors = await getContributorsForFile(owner, repo, filePath);
    return NextResponse.json(contributors);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributors" },
      { status: 500 }
    );
  }
}