declare module "virtual:docs/content" {
  export interface DocFrontmatter {
    title: string;
    description?: string;
    order?: number;
  }

  export interface DocTocEntry {
    id: string;
    title: string;
    level: 2 | 3;
  }

  export interface DocEntry {
    html: string;
    frontmatter: DocFrontmatter;
    toc: DocTocEntry[];
  }

  export const docs: Record<string, DocEntry>;
}

declare module "virtual:docs/search-index" {
  export interface SearchSection {
    title: string;
    hash: string | null;
    content: string[];
  }

  export interface SearchEntry {
    slug: string;
    title: string;
    sections: SearchSection[];
  }

  export const searchData: SearchEntry[];
}

declare module "virtual:docs/navigation" {
  export interface NavLink {
    title: string;
    href: string;
  }

  export interface NavGroup {
    title: string;
    links: NavLink[];
  }

  export const navigation: NavGroup[];
}

declare module "virtual:docs/shiki-classes.css";
