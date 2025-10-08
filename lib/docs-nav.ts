import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export type NavItem = {
  label: string;
  href?: string; // parent folders without index can be non-clickable
  subItems?: NavItem[];
  order?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
  order?: number;
};

const BASE_ROUTE = "/docs"; // change if your docs base route differs
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

const humanize = (name: string) => {
  const s = slugifySegment(name).replace(/-/g, " ");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};

type FM = { title?: string; order?: number; nav_exclude?: boolean };

const readFrontmatter = async (absFile: string): Promise<FM> => {
  const raw = await fs.readFile(absFile, "utf8");
  const { data } = matter(raw);
  return {
    title: typeof data.title === "string" ? data.title : undefined,
    order: typeof data.order === "number" ? data.order : undefined,
    nav_exclude: Boolean(data.nav_exclude),
  };
};

const sortItems = (a: NavItem, b: NavItem) => {
  const ao = a.order ?? 999;
  const bo = b.order ?? 999;
  if (ao !== bo) return ao - bo;
  return a.label.localeCompare(b.label, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

async function collectDir(
  absDir: string,
  segs: string[],
  opts: { excludeIndex?: boolean } = {},
): Promise<NavItem[]> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && MDX_RE.test(e.name));
  const dirs = entries.filter((e) => e.isDirectory());

  const items: NavItem[] = [];

  // Files in this directory
  for (const file of files) {
    const isIndex = /^index\.(mdx|md)$/i.test(file.name);
    if (opts.excludeIndex && isIndex) continue;

    const abs = path.join(absDir, file.name);
    const fm = await readFrontmatter(abs);
    if (fm.nav_exclude) continue;

    const label = fm.title ?? (isIndex ? "Overview" : humanize(file.name));
    const hrefSegs = isIndex ? segs : [...segs, slugifySegment(file.name)];
    const href = `${BASE_ROUTE}/${hrefSegs.join("/")}`;

    items.push({ label, href, order: fm.order });
  }

  // Subdirectories (become grouped items)
  for (const dir of dirs) {
    const folderAbs = path.join(absDir, dir.name);
    const folderSegs = [...segs, slugifySegment(dir.name)];

    const indexPath = path.join(folderAbs, "index.mdx");
    const hasIndex = await fileExists(indexPath);

    let label = humanize(dir.name);
    let href: string | undefined;
    let order: number | undefined;

    if (hasIndex) {
      const fm = await readFrontmatter(indexPath);
      if (!fm.nav_exclude) {
        label = fm.title ?? label;
        order = fm.order;
        href = `${BASE_ROUTE}/${folderSegs.join("/")}`;
      }
    }

    const children = await collectDir(folderAbs, folderSegs, {
      excludeIndex: true,
    });

    if (children.length === 0 && !href) {
      // Empty folder without index: skip
      continue;
    }

    items.push({ label, href, order, subItems: children });
  }

  return items.sort(sortItems);
}

async function buildSections(): Promise<NavSection[]> {
  const entries = await fs.readdir(MARKDOWN_DIR, { withFileTypes: true });
  const sectionDirs = entries.filter((e) => e.isDirectory());

  const sections: NavSection[] = [];

  for (const dir of sectionDirs) {
    const sectionAbs = path.join(MARKDOWN_DIR, dir.name);
    const sectionSegs = [slugifySegment(dir.name)];

    // Section title/order from section/index.mdx if present
    const indexPath = path.join(sectionAbs, "index.mdx");
    let title = humanize(dir.name);
    let order: number | undefined;

    if (await fileExists(indexPath)) {
      const fm = await readFrontmatter(indexPath);
      title = fm.title ?? title;
      order = fm.order;
    }

    const items = await collectDir(sectionAbs, sectionSegs);
    if (items.length === 0) continue;

    sections.push({ title, items, order });
  }

  return sections.sort((a, b) => {
    const ao = a.order ?? 999;
    const bo = b.order ?? 999;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

// Cache at the module level for stable results during a single server run
export const getDocsNav = cache(buildSections);
