import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSS Wiki",
  description: "Open Source Guide for Open Source Contributions",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
