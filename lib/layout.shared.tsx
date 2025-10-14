import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { OssWikiLogo } from "@/components/logo";

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
          <OssWikiLogo width={30} height={30} className="mr-2" />
          OSS Wiki
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
  };
}
