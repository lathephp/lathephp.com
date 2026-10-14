import { Link, useLocation } from "react-router";
import { navigation as nav, flattenNavLinks, findNavGroup, type NavLink } from "~/lib/docs/navigation";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { Separator } from "~/components/ui/separator";

export function PrevNextLinks() {
  const { pathname } = useLocation();
  const allLinks = flattenNavLinks(nav);
  const currentIndex = allLinks.findIndex((link) => link.href === pathname);

  const prev: NavLink | undefined =
    currentIndex > 0 ? allLinks[currentIndex - 1] : undefined;
  const next: NavLink | undefined =
    currentIndex < allLinks.length - 1 ? allLinks[currentIndex + 1] : undefined;

  if (!prev && !next) return null;

  return (
    <>
      <Separator className="mt-16" />
      <div className="mt-8 grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          to={prev.href}
          className="group flex flex-col gap-1 rounded-none border border-border p-4 transition-colors hover:border-brand/40 hover:bg-muted/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RiArrowLeftSLine className="size-3.5" />
            Previous
          </span>
          <span className="text-sm font-medium text-foreground">
            {prev.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {findNavGroup(prev.href, nav)?.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.href}
          className="group flex flex-col items-end gap-1 rounded-none border border-border p-4 text-right transition-colors hover:border-brand/40 hover:bg-muted/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Next
            <RiArrowRightSLine className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground">
            {next.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {findNavGroup(next.href, nav)?.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      </div>
    </>
  );
}
