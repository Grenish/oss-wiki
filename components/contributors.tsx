import Image from "next/image";
import { z } from "zod";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Runtime-safe schema for GitHub API
const ContributorSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  contributions: z.number(),
  type: z.string(), // "User" | "Bot" | etc.
});

type Contributor = z.infer<typeof ContributorSchema>;

export type ContributorsProps = {
  // "owner/repo" format
  repo?: string;
  // Limit how many to display (after sorting)
  limit?: number;
  // Hide bot accounts
  hideBots?: boolean;
  // Per-page API page size (max 100)
  perPage?: number;
  className?: string;
};

async function getContributors({
  repo,
  perPage = 100,
  hideBots = true,
}: Required<Pick<ContributorsProps, "repo" | "perPage" | "hideBots">>) {
  if (!repo || !repo.includes("/")) {
    throw new Error("Invalid repo. Expected 'owner/name'.");
  }

  const url = new URL(`https://api.github.com/repos/${repo}/contributors`);
  url.searchParams.set("per_page", String(Math.max(1, Math.min(perPage, 100))));
  // url.searchParams.set("anon", "true"); // uncomment if you want anonymous contributors

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600, tags: [`gh:contributors:${repo}`] },
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "oss-wiki-app",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });

  // GitHub may be computing the list for large repos
  if (res.status === 202) return [];

  if (!res.ok) {
    // Clearer messaging for rate-limits
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 403 && remaining === "0") {
      throw new Error("GitHub API rate limit hit. Try again later.");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body || res.statusText}`);
  }

  const dataUnknown = await res.json();
  const parsed = z.array(ContributorSchema).safeParse(dataUnknown);
  if (!parsed.success) {
    throw new Error("Unexpected GitHub response shape.");
  }

  let list = parsed.data;

  if (hideBots) {
    list = list.filter(
      (u) => u.type !== "Bot" && !/```mathbot```$/i.test(u.login),
    );
  }

  // Sort by contributions desc
  list.sort((a, b) => b.contributions - a.contributions);

  return list;
}

// Server Component – safe to use directly in .mdx
export default async function Contributors({
  repo = "grenishrai/oss-wiki",
  limit,
  hideBots = true,
  perPage = 100,
  className = "",
}: ContributorsProps) {
  let contributors: Contributor[] = [];
  let errorMsg = "";

  try {
    contributors = await getContributors({ repo, perPage, hideBots });
  } catch (err) {
    errorMsg =
      err instanceof Error ? err.message : "Failed to load contributors.";
  }

  if (errorMsg) {
    return (
      <div
        className={[
          "mt-6 rounded-xl border border-destructive/20 bg-destructive/10",
          "text-destructive p-4",
          className,
        ].join(" ")}
      >
        <p className="font-medium">Unable to fetch contributors</p>
        <p className="text-sm text-destructive/90 mt-1">{errorMsg}</p>
        <a
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 underline underline-offset-2"
        >
          View repository on GitHub
        </a>
      </div>
    );
  }

  if (!contributors.length) {
    return (
      <div
        className={[
          "mt-6 rounded-xl border p-6 text-center",
          "text-muted-foreground",
          className,
        ].join(" ")}
      >
        No contributors yet, or GitHub is preparing the list. Check back soon.
      </div>
    );
  }

  const visible =
    typeof limit === "number" ? contributors.slice(0, limit) : contributors;

  return (
    <div
      className={[
        "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6",
        className,
      ].join(" ")}
    >
      {visible.map((user) => (
        <a
          key={user.id}
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "group relative flex flex-col items-center p-5 rounded-xl border",
            "bg-card hover:bg-muted/30 transition-all",
          ].join(" ")}
          title={`${user.login} — ${user.contributions} contribution${user.contributions === 1 ? "" : "s"}`}
        >
          <div className="relative">
            <Image
              src={user.avatar_url}
              alt={user.login}
              width={72}
              height={72}
              className="rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className={[
                "absolute -bottom-1 -right-2 text-[10px] px-1.5 py-0.5 rounded-full",
                "bg-primary text-primary-foreground shadow-sm",
              ].join(" ")}
            >
              {user.contributions}
            </span>
          </div>

          <span className="mt-3 font-medium text-sm text-foreground">
            {user.login}
          </span>

          <span className="mt-1 text-xs text-muted-foreground">
            contributions
          </span>

          <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
}
