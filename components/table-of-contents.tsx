"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
  key: string;
};

export default function TableOfContents() {
  const [activeKey, setActiveKey] = useState("");
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeout = setTimeout(() => {
      const nodeList = document.querySelectorAll<HTMLElement>(
        "h1[id], h2[id], h3[id], h4[id]",
      );
      const elements = Array.from(nodeList);

      const seen = new Map<string, number>();
      elements.forEach((el) => {
        const id = el.id || "";
        const count = (seen.get(id) || 0) + 1;
        seen.set(id, count);
        el.dataset.tocKey = `${id}__${count}`;
      });

      setHeadings(
        elements.map((el) => {
          let text = el.textContent || "";
          text = text.replace(/\s*#$/, ""); // removes last '#' and spaces

          return {
            id: el.id,
            text,
            level: parseInt(el.tagName[1]),
            key: el.dataset.tocKey as string,
          };
        }),
      );

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            )[0];

          if (visible) {
            const tgt = visible.target as HTMLElement;
            setActiveKey(tgt.dataset.tocKey || tgt.id);
          }
        },
        { rootMargin: "-80px 0px -80%" },
      );

      elements.forEach((el) => observer!.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    // Auto-scroll to active item with smooth centering
    if (activeKey && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(
        `[data-key="${activeKey}"]`,
      );
      if (activeElement) {
        const container = scrollContainerRef.current;
        const el = activeElement as HTMLElement;
        const elementTop = el.offsetTop;
        const elementHeight = el.offsetHeight;
        const containerHeight = container.clientHeight;

        const targetScroll =
          elementTop - containerHeight / 2 + elementHeight / 2;

        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [activeKey]);

  if (!headings.length) return null;

  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <nav className="sticky top-20">
        <h3 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          On this page
        </h3>

        <div className="relative rounded-lg">
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-black dark:via-black/90 pointer-events-none z-10 rounded-t-lg" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-black dark:via-black/90 pointer-events-none z-10 rounded-b-lg" />

          <div className="absolute inset-y-0 left-0 w-4 pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-4 pointer-events-none z-10" />

          <div
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-700 transition-colors"
          >
            <div className="py-10">
              <div className="space-y-0.5 px-2">
                {headings.map(({ id, text, level, key }) => {
                  const isActive = activeKey === key;

                  return (
                    <a
                      key={key}
                      data-key={key}
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(id)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`
                        group relative block py-2 px-3 text-[13px] leading-tight rounded-md
                        transition-all duration-300 ease-out
                        ${level === 1 ? "font-medium" : ""}
                        ${level === 2 ? "pl-6" : ""}
                        ${level === 3 ? "pl-9 text-[12px]" : ""}
                        ${level === 4 ? "pl-12 text-[12px]" : ""}
                      `}
                    >
                      <div
                        className={`
                          absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-900 dark:bg-white rounded-full
                          transition-all duration-300
                          ${isActive ? "opacity-100 h-5" : "opacity-0 h-3"}
                        `}
                      />

                      <div
                        className={`
                          absolute inset-0 rounded-md transition-all duration-300
                          ${
                            isActive
                              ? "bg-gray-100 dark:bg-gray-800/60"
                              : "bg-transparent group-hover:bg-gray-50 dark:group-hover:bg-gray-800/30"
                          }
                        `}
                      />

                      <span
                        className={`
                          relative block truncate transition-all duration-300
                          ${
                            isActive
                              ? "text-gray-900 dark:text-white translate-x-1"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                          }
                        `}
                      >
                        {text}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        /* Custom scrollbar fine-tuning */
        div::-webkit-scrollbar {
          width: 3px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          border-radius: 3px;
        }
      `}</style>
    </aside>
  );
}
