import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Brain } from "lucide-react";

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
          <Brain />
          OSS Wiki
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
  };
}
