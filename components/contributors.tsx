import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import {
  Star,
  GitFork,
  AlertCircle,
  Users,
  GitCommit,
  ExternalLink,
  Calendar,
  Code,
  Scale,
} from "lucide-react";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Schemas
const ContributorSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  contributions: z.number(),
  type: z.string(),
});
type Contributor = z.infer<typeof ContributorSchema>;

const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable().optional(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  watchers_count: z.number(),
  language: z.string().nullable().optional(),
  license: z
    .object({
      key: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
    html_url: z.string().url(),
    avatar_url: z.string().url(),
    type: z.string(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
});
type Repo = z.infer<typeof RepoSchema>;

export type ContributorsProps = {
  repo?: string;
  limit?: number;
  hideBots?: boolean;
  perPage?: number;
  className?: string;
};

function ghHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "oss-wiki-app",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  } as const;
}

async function getRepo(repo: string): Promise<Repo> {
  if (!repo || !repo.includes("/")) {
    throw new Error("Invalid repo. Expected 'owner/name'.");
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    next: { revalidate: 3600, tags: [`gh:repo:${repo}`] },
    headers: ghHeaders(),
  });

  if ([202, 204, 304, 409].includes(res.status)) {
    throw new Error("Repository metadata is not available yet.");
  }

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 403 && remaining === "0") {
      throw new Error("GitHub API rate limit hit. Try again later.");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body || res.statusText}`);
  }

  const dataUnknown = await res.json().catch(() => null);
  const parsed = RepoSchema.safeParse(dataUnknown);
  if (!parsed.success) {
    throw new Error("Unexpected GitHub repository response shape.");
  }
  return parsed.data;
}

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

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600, tags: [`gh:contributors:${repo}`] },
    headers: ghHeaders(),
  });

  if ([202, 204, 304, 409].includes(res.status)) {
    return [];
  }

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 403 && remaining === "0") {
      throw new Error("GitHub API rate limit hit. Try again later.");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body || res.statusText}`);
  }

  const dataUnknown = await res.json().catch(() => []);
  if (!Array.isArray(dataUnknown)) return [];

  const parsed = z.array(ContributorSchema).safeParse(dataUnknown);
  if (!parsed.success) return [];

  let list = parsed.data;

  if (hideBots) {
    list = list.filter(
      (u) => u.type !== "Bot" && !/```mathbot]$/i.test(u.login),
    );
  }

  list.sort((a, b) => b.contributions - a.contributions);

  return list;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Contributors({
  repo = "Grenish/oss-wiki",
  limit,
  hideBots = true,
  perPage = 100,
  className = "",
}: ContributorsProps) {
  let contributors: Contributor[] = [];
  let repoMeta: Repo | null = null;
  let contributorsError = "";
  let repoError = "";

  const [repoRes, contribRes] = await Promise.allSettled([
    getRepo(repo),
    getContributors({ repo, perPage, hideBots }),
  ]);

  if (repoRes.status === "fulfilled") {
    repoMeta = repoRes.value;
  } else {
    repoError =
      repoRes.reason instanceof Error
        ? repoRes.reason.message
        : "Failed to load repository.";
  }

  if (contribRes.status === "fulfilled") {
    contributors = contribRes.value;
  } else {
    contributorsError =
      contribRes.reason instanceof Error
        ? contribRes.reason.message
        : "Failed to load contributors.";
  }

  const ownerLogin = repoMeta?.owner.login?.toLowerCase();
  const cleanedContributors = ownerLogin
    ? contributors.filter((u) => u.login.toLowerCase() !== ownerLogin)
    : contributors;

  const visible =
    typeof limit === "number"
      ? cleanedContributors.slice(0, limit)
      : cleanedContributors;

  return (
    <section className={["mt-8", className].join(" ")}>
      {/* Owner Section */}
      <div className="rounded-xl border border-border/50 bg-card p-6 md:p-8">
        {repoMeta ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <Image
                  src={repoMeta.owner.avatar_url}
                  alt={repoMeta.owner.login}
                  width={72}
                  height={72}
                  className="rounded-xl ring-1 ring-border/50 object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={repoMeta.owner.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="text-xl font-semibold hover:text-primary transition-colors no-underline"
                  >
                    {repoMeta.owner.login}
                  </Link>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground font-medium">
                    {repoMeta.owner.type}
                  </span>
                </div>
                <Link
                  href={repoMeta.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1 no-underline"
                >
                  {repoMeta.full_name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                {repoMeta.description && (
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed max-w-2xl">
                    {repoMeta.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-medium">Stars</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatNumber(repoMeta.stargazers_count)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GitFork className="h-4 w-4" />
                  <span className="text-xs font-medium">Forks</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatNumber(repoMeta.forks_count)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Issues</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatNumber(repoMeta.open_issues_count)}
                </p>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-border/50 text-xs text-muted-foreground">
              {repoMeta.language && (
                <div className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  <span>{repoMeta.language}</span>
                </div>
              )}
              {repoMeta.license?.name && (
                <div className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  <span>{repoMeta.license.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated {formatDate(repoMeta.updated_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={repoMeta.html_url}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity no-underline"
              >
                View Repository
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href={repoMeta.owner.html_url}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors no-underline"
              >
                View Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load repository</p>
              <p className="text-sm text-destructive/80 mt-1">{repoError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contributors Section */}
      <div className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Contributors</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {visible.length > 0
                ? `${visible.length} contributor${visible.length === 1 ? "" : "s"}${typeof limit === "number" && cleanedContributors.length > limit ? ` of ${cleanedContributors.length}` : ""}`
                : contributorsError
                  ? "Unable to load contributors"
                  : "No contributors yet"}
            </p>
          </div>
          {typeof limit === "number" && cleanedContributors.length > limit && (
            <Link
              href={`https://github.com/${repo}/graphs/contributors`}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 no-underline"
            >
              View all
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {contributorsError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Failed to fetch contributors</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {contributorsError}
                </p>
                <Link
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="inline-flex items-center gap-1 text-sm mt-3 no-underline"
                >
                  View on GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : visible.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((user, idx) => (
              <Link
                key={user.id}
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="group relative rounded-lg border border-border/50 bg-card p-4 hover:border-border hover:shadow-sm transition-all no-underline"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Image
                      src={user.avatar_url}
                      alt={user.login}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg ring-1 ring-border/50 object-cover"
                    />
                    {idx < 3 && (
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {user.login}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <GitCommit className="h-3.5 w-3.5" />
                      <span>
                        {formatNumber(user.contributions)}{" "}
                        {user.contributions === 1 ? "commit" : "commits"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground/80">
              No contributors yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to contribute to this project
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
