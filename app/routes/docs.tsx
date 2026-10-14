import { Link, Outlet } from "react-router";
import { LatheLogo } from "~/components/lathe-logo";
import { ThemeToggle } from "~/components/theme-toggle";
import { DocsNavigation } from "~/components/docs/docs-navigation";
import { DocsMobileNav } from "~/components/docs/docs-mobile-nav";
import { DocsSearch } from "~/components/docs/docs-search";
import { Button } from "~/components/ui/button";
import { RiMenuLine, RiCloseLine } from "@remixicon/react";
import { useCallback, useState } from "react";
// Generated class table for Shiki's token colors, see transformerStyleToClass
// in the docs plugin. Imported here so it ships only with the docs routes.
import "virtual:docs/shiki-classes.css";

export default function DocsLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? (
                <RiCloseLine className="size-5" />
              ) : (
                <RiMenuLine className="size-5" />
              )}
            </Button>

            <Link to="/" className="flex items-center gap-2.5">
              <LatheLogo />
            </Link>
          </div>

          {/* Center: search. One instance on every screen size, since each
              instance listens for Ctrl+K and opens its own dialog. */}
          <div className="mx-auto flex max-w-md flex-1 justify-center lg:max-w-sm">
            <DocsSearch />
          </div>

          {/* Right: links + theme */}
          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-0.5 sm:flex">
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                nativeButton={false}
                render={<a href="https://demo.lathephp.com">Demo</a>}
              />
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                nativeButton={false}
                render={<a href="https://github.com/lathephp/benchmarks">Benchmarks</a>}
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <DocsMobileNav open={mobileNavOpen} onClose={closeMobileNav} />

      {/* Content area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:w-56 lg:shrink-0">
            <div className="sticky top-[calc(3.5rem+1px)] max-h-[calc(100vh-3.5rem-1px)] overflow-y-auto border-r border-border py-10 pr-6">
              <DocsNavigation />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 py-10 lg:pl-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
