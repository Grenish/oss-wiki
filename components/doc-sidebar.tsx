import { getDocsNav } from "@/lib/docs-nav";
import { DocSidebarClient } from "./doc-sidebar-client";

export default async function DocSidebar() {
  const sections = await getDocsNav();
  return <DocSidebarClient sections={sections} />;
}
