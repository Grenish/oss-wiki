export default async function Docs() {
  const { default: Post } = await import(
    `@/markdown/about.mdx`
  );

  return <Post />;
}
