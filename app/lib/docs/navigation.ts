import { navigation, type NavGroup, type NavLink } from "virtual:docs/navigation";

export { navigation, type NavGroup, type NavLink };

/**
 * Drops a trailing slash, so /docs/x/y/ and /docs/x/y name the same page.
 * Cloudflare Pages may serve docs/x/y/index.html at either path.
 */
export function pagePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function flattenNavLinks(nav: NavGroup[]): NavLink[] {
  return nav.flatMap((group) => group.links);
}

export function findNavGroup(pathname: string, nav: NavGroup[] = navigation): NavGroup | undefined {
  return nav.find((group) => group.links.some((link) => link.href === pagePath(pathname)));
}
