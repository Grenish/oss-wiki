"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

  if (pathname === "/docs" || pathname === "/docs/") {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mb-6">
        <Link
          href="/docs"
          className="hover:text-gray-900 dark:hover:text-gray-300"
        >
          Documentation
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <span className="text-gray-900 dark:text-gray-300 font-medium">
          Welcome
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mb-6">
      {pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;

        let text = capitalize(segment);
        if (index === 0 && segment.toLowerCase() === "docs") {
          text = "Documentation";
        }

        return (
          <Fragment key={href}>
            <Link
              href={href}
              className={
                isLast
                  ? "text-gray-900 dark:text-gray-300 font-medium"
                  : "hover:text-gray-900 dark:hover:text-gray-300"
              }
            >
              {text}
            </Link>
            {!isLast && (
              <span className="text-gray-400 dark:text-gray-600">/</span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
