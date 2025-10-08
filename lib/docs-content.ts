import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

const MARKDOWN_DIR = path.join(process.cwd(), "markdown");
const MDX_RE = /\.(mdx|md)$/i;

const fileExists = async (p: string) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const slugifySegment = (name: string) =>
  name
    .replace(MDX_RE, "")
    .replace(/^\d+[-_\s]?/, "")
    .replace(/_/g, "-")
    .toLowerCase();

export type DocFrontmatter = {
  title?: string;
  description?: string;
  order?: number;
  nav_exclude?: boolean;
};

export type DocFile = {
  absPath: string;
  frontmatter: DocFrontmatter;
  content: string;
};

// find a real folder name by a slugified segment (to support "01-intro" -> "intro")
async function findDirBySlug(
  parentAbs: string,
  seg: string,
): Promise<string | undefined> {
  const entries = await fs.readdir(parentAbs, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && slugifySegment(e.name) === seg) {
      return e.name;
    }
  }
  return undefined;
}

// find a real file by a slugified segment (intro -> "01-intro.mdx")
async function findFileBySlug(
  parentAbs: string,
  seg: string,
): Promise<string | undefined> {
  const entries = await fs.readdir(parentAbs, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && MDX_RE.test(e.name) && slugifySegment(e.name) === seg) {
      return e.name;
    }
  }
  return undefined;
}

// Resolve a slug (["getting-started","intro"]) to an absolute file path.
export async function resolveDocPath(
  slug?: string[],
): Promise<string | undefined> {
  const segments = slug ?? [];
  let current = MARKDOWN_DIR;

  // No slug -> markdown/index.mdx
  if (segments.length === 0) {
    const idx = path.join(current, "index.mdx");
    if (await fileExists(idx)) return idx;
    const idxMd = path.join(current, "index.md");
    if (await fileExists(idxMd)) return idxMd;
    return undefined;
  }

  // Walk all but last segment as directories
  for (let i = 0; i < segments.length - 1; i++) {
    const real = await findDirBySlug(current, segments[i]);
    if (!real) return undefined;
    current = path.join(current, real);
  }

  const last = segments[segments.length - 1];

  // Prefer directory with index.mdx
  const dirReal = await findDirBySlug(current, last);
  if (dirReal) {
    const asDir = path.join(current, dirReal);
    const idx = path.join(asDir, "index.mdx");
    if (await fileExists(idx)) return idx;
    const idxMd = path.join(asDir, "index.md");
    if (await fileExists(idxMd)) return idxMd;
  }

  // Else a file with that slug
  const fileReal = await findFileBySlug(current, last);
  if (fileReal) {
    return path.join(current, fileReal);
  }

  return undefined;
}

export const readDocFile = cache(
  async (slug?: string[]): Promise<DocFile | undefined> => {
    const absPath = await resolveDocPath(slug);
    if (!absPath) return undefined;
    const raw = await fs.readFile(absPath, "utf8");
    const { content, data } = matter(raw);
    const fm: DocFrontmatter = {
      title: typeof data.title === "string" ? data.title : undefined,
      description:
        typeof data.description === "string" ? data.description : undefined,
      order: typeof data.order === "number" ? data.order : undefined,
      nav_exclude: Boolean(data.nav_exclude),
    };
    return { absPath, content, frontmatter: fm };
  },
);

// Build all possible slugs for SSG.
// - markdown/index.mdx -> []
// - markdown/section/index.mdx -> ["section"]
// - markdown/section/file.mdx -> ["section", "file"]
export const getAllDocSlugs = cache(
  async (): Promise<{ slug?: string[] }[]> => {
    const out: { slug?: string[] }[] = [];

    async function walk(dirAbs: string, segs: string[]) {
      const entries = await fs.readdir(dirAbs, { withFileTypes: true });
      const files = entries.filter((e) => e.isFile() && MDX_RE.test(e.name));
      const dirs = entries.filter((e) => e.isDirectory());

      // index at this level
      const hasIndexMdx = files.some((f) => /^index\.mdx$/i.test(f.name));
      const hasIndexMd = files.some((f) => /^index\.md$/i.test(f.name));
      if (hasIndexMdx || hasIndexMd) {
        out.push({ slug: segs.length ? segs : undefined }); // optional catch-all supports undefined for root
      }

      // non-index files
      for (const f of files) {
        if (/^index\.(mdx|md)$/i.test(f.name)) continue;
        out.push({ slug: [...segs, slugifySegment(f.name)] });
      }

      // nested dirs
      for (const d of dirs) {
        await walk(path.join(dirAbs, d.name), [
          ...segs,
          slugifySegment(d.name),
        ]);
      }
    }

    // root index
    const rootIndexMdx = path.join(MARKDOWN_DIR, "index.mdx");
    const rootIndexMd = path.join(MARKDOWN_DIR, "index.md");
    if ((await fileExists(rootIndexMdx)) || (await fileExists(rootIndexMd))) {
      out.push({ slug: undefined });
    }

    await walk(MARKDOWN_DIR, []);
    // dedupe
    const seen = new Set<string>();
    return out.filter((p) => {
      const key = (p.slug ?? []).join("/");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
);
