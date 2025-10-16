import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/oss-wiki-logo.png"
            alt="OSS Wiki Logo"
            width={50}
            height={50}
            className="mr-1"
            priority
          />
          OSS Wiki
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
  };
}
