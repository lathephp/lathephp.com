import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { DocsNavigation } from "./docs-navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

export function DocsMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { pathname } = useLocation();
  const lastPathname = useRef(pathname);

  // Close on navigation only. Firing on mount too made the docs layout
  // re-render on every page load just to set an already-false flag.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    onClose();
  }, [pathname, onClose]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 overflow-y-auto lg:hidden" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-8">
          <DocsNavigation onLinkClick={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
