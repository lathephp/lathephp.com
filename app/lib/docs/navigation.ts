import { navigation, type NavGroup, type NavLink } from "virtual:docs/navigation";

export { navigation, type NavGroup, type NavLink };

export function flattenNavLinks(nav: NavGroup[]): NavLink[] {
  return nav.flatMap((group) => group.links);
}

export function findNavGroup(pathname: string, nav: NavGroup[] = navigation): NavGroup | undefined {
  return nav.find((group) => group.links.some((link) => link.href === pathname));
}
