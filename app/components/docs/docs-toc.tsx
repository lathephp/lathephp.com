import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import type { DocTocEntry } from "virtual:docs/content";

export function TableOfContents({ toc }: { toc: DocTocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const headingTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const ids = toc.map((e) => e.id);

    function updateActive() {
      const scrollY = window.scrollY;
      const offset = 120; // px below top of viewport to consider "active"

      // Rebuild heading positions (they can shift after images load, etc.)
      headingTops.current.clear();
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          headingTops.current.set(id, el.getBoundingClientRect().top + scrollY);
        }
      }

      // Find the last heading that's above the offset line
      let current = "";
      for (const id of ids) {
        const top = headingTops.current.get(id);
        if (top !== undefined && top <= scrollY + offset) {
          current = id;
        }
      }

      // If nothing is above the offset, use the first heading
      if (!current && ids.length > 0) {
        current = ids[0];
      }

      setActiveId(current);
    }

    updateActive();

    const onHashChange = () => requestAnimationFrame(updateActive);

    window.addEventListener("scroll", updateActive, { passive: true });
    // Also update after hash navigation (click on TOC link)
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <div className="hidden xl:block xl:w-52 xl:shrink-0">
      <div className="sticky top-[calc(3.5rem+1px)] max-h-[calc(100vh-3.5rem-1px)] overflow-y-auto py-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand/70">
          On this page
        </p>
        <ul className="mt-3 border-l border-border">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 text-[13px] leading-5 transition-colors",
                  entry.level === 3 ? "pl-6" : "pl-4",
                  activeId === entry.id
                    ? "border-brand text-brand font-medium"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                )}
              >
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
