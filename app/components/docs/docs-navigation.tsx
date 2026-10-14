import { Link, useLocation } from "react-router";
import { navigation as defaultNav, type NavGroup } from "~/lib/docs/navigation";
import { cn } from "~/lib/utils";

export function DocsNavigation({
  nav,
  onLinkClick,
}: {
  nav?: NavGroup[];
  onLinkClick?: () => void;
}) {
  const { pathname } = useLocation();
  const groups = nav ?? defaultNav;

  return (
    <nav aria-label="Docs" className="flex flex-col gap-8">
      {groups.map((group: NavGroup) => (
        <div key={group.title}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand/70">
            {group.title}
          </h4>
          <ul className="mt-3 flex flex-col gap-px border-l border-border">
            {group.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={onLinkClick}
                    className={cn(
                      "-ml-px block border-l-2 py-1.5 pl-4 text-[13px] leading-6 transition-colors",
                      isActive
                        ? "border-brand text-brand font-medium"
                        : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                    )}
                  >
                    {link.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
