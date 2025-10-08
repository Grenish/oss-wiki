import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { readDocFile, getAllDocSlugs } from "@/lib/docs-content";

export const dynamic = "force-static"; // SSG by default
export const revalidate = false; // set a number if you want ISR

type Props = {
  params: { slug?: string[] };
};

export async function generateStaticParams() {
  // Pre-render every md/mdx file we found
  return getAllDocSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await readDocFile(params.slug);
  if (!doc) return {};
  const title = doc.frontmatter.title ?? "Docs";
  const description = doc.frontmatter.description;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DocsPage({ params }: Props) {
  const doc = await readDocFile(params.slug);
  if (!doc) notFound();

  return (
    <main className="px-6 py-8 md:px-8 lg:px-10">
      {/* Title from frontmatter (optional) */}
      {doc.frontmatter.title ? (
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {doc.frontmatter.title}
        </h1>
      ) : null}

      <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <MDXRemote
          source={doc.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [
                  // adds anchor links to headings
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  rehypeAutolinkHeadings as any,
                  {
                    behavior: "wrap",
                    properties: {
                      className:
                        "no-underline hover:underline decoration-muted-foreground/50",
                    },
                  },
                ],
              ],
            },
          }}
          // You can pass custom MDX components here if you have them:
          components={
            {
              // Example: style tables or callouts later
            }
          }
        />
      </article>
    </main>
  );
}
