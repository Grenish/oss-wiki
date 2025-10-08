export default async function Docs() {
  const { default: Post } = await import(
    `@/markdown/getting-started/about.mdx`
  );

  return <Post />;
}
