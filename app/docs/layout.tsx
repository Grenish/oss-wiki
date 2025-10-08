import DocSidebar from "@/components/doc-sidebar";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Breadcrumb from "@/components/breadcrumb";
import TableOfContents from "@/components/table-of-contents";

const mont = Montserrat({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open Source Guide",
  description:
    "Authrix is a developer-focused authentication solution that simplifies user management and enhances security for your applications.",
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={`${mont.className} antialiased w-full min-h-screen `}>
      <div className="flex w-full h-[calc(100vh-56px)]">
        <aside className="hidden md:flex flex-col w-64  z-20  min-h-screen">
          <DocSidebar />
        </aside>
        <section className="flex-1 overflow-y-auto min-h-screen">
          <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto flex gap-12 pt-5">
              <article className="flex-1 px-6 lg:px-8 py-12 lg:py-16 max-w-4xl">
                <Breadcrumb />
                {children}
              </article>
              <TableOfContents />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
