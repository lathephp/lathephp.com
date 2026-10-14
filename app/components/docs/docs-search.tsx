import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { SearchResult, search as searchFn } from "~/lib/docs/search";
import { RiSearchLine, RiArrowRightUpLine, RiFileTextLine } from "@remixicon/react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { Kbd } from "~/components/ui/kbd";
import { Separator } from "~/components/ui/separator";

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<typeof searchFn | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open && !search) {
      import("~/lib/docs/search")
        .then((mod) => setSearch(() => mod.search))
        .catch(() => {
          // A failed chunk fetch (offline, stale deploy) leaves `search` null,
          // which the dialog already renders as "no results" rather than
          // hanging on an unhandled rejection.
        });
    }
  }, [open, search]);

  const results = useMemo(
    () => (search ? search(query) : []),
    [search, query]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const url = `/docs/${result.slug}${result.hash ? `#${result.hash}` : ""}`;
      navigate(url);
      setOpen(false);
    },
    [navigate]
  );

  const grouped = results.reduce<
    Map<string, { pageTitle: string; slug: string; items: SearchResult[] }>
  >((acc, result) => {
    const existing = acc.get(result.slug);
    if (existing) {
      existing.items.push(result);
    } else {
      acc.set(result.slug, {
        pageTitle: result.pageTitle,
        slug: result.slug,
        items: [result],
      });
    }
    return acc;
  }, new Map());

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-auto sm:min-w-[16rem]"
        onClick={() => setOpen(true)}
      >
        <RiSearchLine data-icon="inline-start" />
        <span className="hidden flex-1 px-1.5 text-left text-xs text-muted-foreground sm:inline">
          Search...
        </span>
        <Kbd className="border border-brand/30 text-brand">
          <span className="text-xs">&#8984;</span>K
        </Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Documentation"
        description="Search across all documentation pages"
        className="sm:max-w-lg"
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search documentation..."
            className="text-sm"
          />

          <CommandList>
            {query && results.length === 0 && (
              <CommandEmpty>
                No results for &ldquo;{query}&rdquo;
              </CommandEmpty>
            )}

            {!query && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Type to search across all docs...
              </div>
            )}

            {Array.from(grouped.entries()).map(([slug, group]) => (
              <CommandGroup key={slug} heading={group.pageTitle}>
                {group.items.map((result) => (
                  <CommandItem
                    key={`${slug}-${result.hash ?? result.sectionTitle}`}
                    value={`${result.pageTitle} ${result.sectionTitle}`}
                    onSelect={() => handleSelect(result)}
                    className="gap-2.5"
                  >
                    <RiFileTextLine className="size-4 shrink-0 opacity-50" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {result.sectionTitle}
                      </div>
                      {result.content && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {result.content.slice(0, 80)}
                          {result.content.length > 80 ? "..." : ""}
                        </div>
                      )}
                    </div>
                    <RiArrowRightUpLine className="size-3 shrink-0 opacity-30" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>

          <Separator />
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>&uarr;&darr;</Kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>&crarr;</Kbd>
                open
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd>
              close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
