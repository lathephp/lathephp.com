import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import {
  transformerNotationHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerMetaHighlight,
  transformerStyleToClass,
} from "@shikijs/transformers";
import type { Plugin } from "vite";
import { listDocSlugs, resolveDocsDir } from "./docs-source";
import type { Root as MdastRoot } from "mdast";
import type { ShikiTransformer } from "shiki";

// --- Types ---

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

interface SearchSection {
  title: string;
  hash: string | null;
  content: string[];
}

interface SearchEntry {
  slug: string;
  title: string;
  sections: SearchSection[];
}

// --- Helpers ---

function extractFrontmatter(raw: string): {
  frontmatter: DocFrontmatter;
  content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { title: "Untitled" },
      content: raw,
    };
  }
  const parsed = yaml.parse(match[1]) as DocFrontmatter;
  return {
    frontmatter: {
      title: parsed.title ?? "Untitled",
      description: parsed.description,
      order: parsed.order,
    },
    content: match[2],
  };
}

function extractToc(content: string): DocTocEntry[] {
  const toc: DocTocEntry[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const title = match[2].trim();
    const id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    toc.push({ id, title, level });
  }

  return toc;
}

function extractSearchSections(content: string, slug: string, title: string): SearchEntry {
  const sections: SearchSection[] = [];
  const lines = content.split("\n");
  let currentSection: SearchSection = {
    title,
    hash: null,
    content: [],
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match || h3Match) {
      // Save previous section if it has content
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      const heading = (h2Match ?? h3Match)![1].trim();
      const hash = heading
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      currentSection = { title: heading, hash, content: [] };
    } else {
      // Strip markdown syntax for search content
      const stripped = line
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]+`/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~#>]/g, "")
        .trim();
      if (stripped) {
        currentSection.content.push(stripped);
      }
    }
  }

  // Don't forget the last section
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return { slug, title, sections };
}

// --- Shiki transformer: code block title/filename header ---

function transformerCodeTitle(): ShikiTransformer {
  return {
    name: "code-title",
    pre(node) {
      const meta = this.options.meta?.__raw;
      if (!meta) return;

      // Parse title="filename" from code fence meta
      const titleMatch = meta.match(/title="([^"]+)"/);
      if (!titleMatch) return;

      const title = titleMatch[1];

      // Wrap the pre in a container div with a header
      // We modify the pre's parent structure by adding properties
      // that CSS will use, and inject the title as a data attribute
      node.properties["data-title"] = title;
    },
  };
}

// --- Rehype: swap docs images for theme-aware light/dark pairs ---
// For `/images/docs/x.png`, if both `x-light.png` and `x-dark.png` exist in
// public/, emit two <img> (light + dark) toggled via CSS on the `.dark` class.
// Falls back to the original single image when variants are absent.
function rehypeThemeImages(publicDir: string) {
  return (tree: any) => {
    const walk = (node: any) => {
      if (!node || !Array.isArray(node.children)) return;
      const out: any[] = [];
      for (const child of node.children) {
        const src =
          child?.type === "element" &&
          child.tagName === "img" &&
          typeof child.properties?.src === "string"
            ? (child.properties.src as string)
            : null;
        const m = src && src.startsWith("/images/docs/")
          ? src.match(/^(.*)\.(png|jpe?g|webp)$/i)
          : null;
        if (m) {
          const [, base, ext] = m;
          const lightRel = `${base}-light.${ext}`;
          const darkRel = `${base}-dark.${ext}`;
          const lightPath = path.join(publicDir, lightRel.replace(/^\//, ""));
          const darkPath = path.join(publicDir, darkRel.replace(/^\//, ""));
          if (fs.existsSync(lightPath) && fs.existsSync(darkPath)) {
            const alt = child.properties.alt ?? "";
            out.push(
              {
                type: "element",
                tagName: "img",
                properties: { src: lightRel, alt, loading: "lazy", decoding: "async", className: ["doc-img", "doc-img-light"] },
                children: [],
              },
              {
                type: "element",
                tagName: "img",
                properties: { src: darkRel, alt, loading: "lazy", decoding: "async", className: ["doc-img", "doc-img-dark"] },
                children: [],
              }
            );
            continue;
          }
        }
        walk(child);
        out.push(child);
      }
      node.children = out;
    };
    walk(tree);
  };
}

// --- Rehype: turn links between .md files into site links ---
// `fields.md#hash` in docs/your-first-resource/ becomes
// `/docs/your-first-resource/fields#hash`. A link that leaves docs/ fails the
// build, since the site has no page for it.
function rehypeDocLinks() {
  return (tree: any, file: { path: string }) => {
    const walk = (node: any) => {
      const href = node?.type === "element" && node.tagName === "a" ? node.properties?.href : null;
      const m = typeof href === "string" ? href.match(/^([^:/#?][^:#?]*)\.md(#.*)?$/) : null;
      if (m) {
        const target = path.posix.join(path.posix.dirname(file.path), m[1]);
        if (target.startsWith("..")) {
          throw new Error(`${file.path}: link ${href} points outside docs/`);
        }
        node.properties.href = `/docs/${target}${m[2] ?? ""}`;
      }
      node?.children?.forEach(walk);
    };
    walk(tree);
  };
}

// --- Rehype: give each table its own horizontal scroll box ---
// A wide table would otherwise make the whole page scroll sideways on a phone.
function rehypeScrollTables() {
  return (tree: any) => {
    const walk = (node: any) => {
      node?.children?.forEach((child: any, i: number) => {
        if (child?.type === "element" && child.tagName === "table") {
          node.children[i] = {
            type: "element",
            tagName: "div",
            properties: { className: ["table-scroll"] },
            children: [child],
          };
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
  };
}

// --- Unified processor factory ---

type StyleToClass = ReturnType<typeof transformerStyleToClass>;

async function createProcessor(publicDir: string, styleToClass: StyleToClass) {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(() => {
      // Strip frontmatter nodes from the tree so they don't render, and the
      // page's `# Title` too: the page header renders the front matter title.
      return (tree: MdastRoot) => {
        tree.children = tree.children.filter((node) => node.type !== "yaml");
        const first = tree.children[0];
        if (first?.type === "heading" && first.depth === 1) tree.children.shift();
      };
    })
    .use(() => {
      // Transform GitHub-style callouts: > [!NOTE], > [!WARNING], > [!TIP], > [!IMPORTANT], > [!CAUTION]
      return (tree: MdastRoot) => {
        for (let i = 0; i < tree.children.length; i++) {
          const node = tree.children[i];
          if (node.type !== "blockquote" || !node.children.length) continue;

          const firstChild = node.children[0];
          if (firstChild.type !== "paragraph" || !firstChild.children.length)
            continue;

          const firstInline = firstChild.children[0];
          if (firstInline.type !== "text") continue;

          const calloutMatch = firstInline.value.match(
            /^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*/
          );
          if (!calloutMatch) continue;

          const type = calloutMatch[1].toLowerCase();
          const label =
            type.charAt(0).toUpperCase() + type.slice(1);

          // Remove the [!TYPE] prefix from text
          firstInline.value = firstInline.value
            .slice(calloutMatch[0].length)
            .replace(/^\n/, "");

          // If the text is now empty, remove it
          if (!firstInline.value) {
            firstChild.children.shift();
          }

          // Replace blockquote with raw HTML wrapper
          const innerHtml = `<div class="callout callout-${type}" role="alert"><p class="callout-title">${label}</p>`;
          tree.children.splice(i, 0, {
            type: "html",
            value: innerHtml,
          } as any);
          // Insert closing div after the blockquote content
          // Convert blockquote children to be at the tree level
          const contentNodes = node.children;
          tree.children.splice(i + 1, 1, ...contentNodes, {
            type: "html",
            value: "</div>",
          } as any);
          // Skip past the inserted nodes
          i += contentNodes.length;
        }
      };
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(() => rehypeThemeImages(publicDir))
    .use(rehypeDocLinks)
    .use(rehypeScrollTables)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["anchor-link"] },
    })
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      langAlias: {
        env: "dotenv",
      },
      defaultColor: false,
      transformers: [
        transformerNotationHighlight(),
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
        transformerCodeTitle(),
        // Shiki tags every token with an inline
        // `style="--shiki-light:#…;--shiki-dark:#…"` — roughly 48 bytes each,
        // and the largest page carries ~3.7k of them. Worse, React Router
        // serializes the rendered HTML a second time into the hydration
        // payload, so every one of those bytes is paid for twice. Hoisting the
        // colors into generated classes shrinks both copies at once.
        styleToClass,
      ],
    })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

// --- Sidebar ---

// Each folder of docs/ is one sidebar section, in this order. A folder not
// listed here comes after these.
const SECTION_ORDER = [
  "getting-started",
  "your-first-resource",
  "querying",
  "taking-action",
  "organizing",
  "security",
  "extending",
];

interface NavGroup {
  title: string;
  links: { title: string; href: string }[];
}

function buildNavigation(docs: Record<string, DocEntry>): NavGroup[] {
  const folders = [...new Set(Object.keys(docs).map((slug) => slug.split("/")[0]))];
  const rank = (folder: string) =>
    SECTION_ORDER.includes(folder) ? SECTION_ORDER.indexOf(folder) : SECTION_ORDER.length;
  folders.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  return folders.map((folder) => ({
    // "your-first-resource" reads "Your first resource".
    title: folder.charAt(0).toUpperCase() + folder.slice(1).replace(/-/g, " "),
    links: Object.entries(docs)
      .filter(([slug]) => slug.startsWith(`${folder}/`))
      .sort(
        ([, a], [, b]) =>
          (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity) ||
          a.frontmatter.title.localeCompare(b.frontmatter.title)
      )
      .map(([slug, doc]) => ({ title: doc.frontmatter.title, href: `/docs/${slug}` })),
  }));
}

// --- Main plugin ---

export function docsPlugin(): Plugin {
  const VIRTUAL_CONTENT = "virtual:docs/content";
  const VIRTUAL_SEARCH = "virtual:docs/search-index";
  const VIRTUAL_NAVIGATION = "virtual:docs/navigation";
  const VIRTUAL_SHIKI_CSS = "virtual:docs/shiki-classes.css";
  const RESOLVED_CONTENT = "\0" + VIRTUAL_CONTENT;
  const RESOLVED_SEARCH = "\0" + VIRTUAL_SEARCH;
  const RESOLVED_NAVIGATION = "\0" + VIRTUAL_NAVIGATION;
  // Vite keys CSS handling off the extension, so this one keeps its `.css`
  // suffix instead of taking the usual `\0` prefix.
  const RESOLVED_SHIKI_CSS = "\0virtual_docs_shiki_classes.css";

  let root: string;
  let resolvedDocsDir: string | null = null;
  let resolvedPublicDir: string;

  // Resolved on first use, so `react-router typegen` loads this config
  // without a docs folder or a fetch.
  function docsDir() {
    resolvedDocsDir ??= resolveDocsDir(root);
    return resolvedDocsDir;
  }
  let processor: ReturnType<typeof createProcessor> | null = null;
  let styleToClass: StyleToClass | null = null;
  let docsCache: ReturnType<typeof loadAllDocsUncached> | null = null;

  async function getProcessor() {
    if (!processor) {
      styleToClass = transformerStyleToClass({ classPrefix: "shiki-" });
      processor = createProcessor(resolvedPublicDir, styleToClass);
    }
    return processor;
  }

  /** Reset every derived cache, used when a doc changes in dev. */
  function invalidateDocs() {
    processor = null;
    styleToClass = null;
    docsCache = null;
  }

  /**
   * Memoized: `load` is called once per virtual module, and re-highlighting all
   * of the docs for each of them meant the build paid Shiki's cost once per
   * module for identical output.
   */
  function loadAllDocs() {
    if (!docsCache) docsCache = loadAllDocsUncached();
    return docsCache;
  }

  async function loadAllDocsUncached(): Promise<{
    docs: Record<string, DocEntry>;
    searchData: SearchEntry[];
  }> {
    const slugs = listDocSlugs(docsDir());
    const proc = await getProcessor();

    // Each file is independent, so highlighting them concurrently costs about
    // as much as the longest one. `Promise.all` keeps the input order, so the
    // slug map and search index stay stable.
    const processed = await Promise.all(
      slugs.map(async (slug) => {
        const file = `${slug}.md`;
        const rawMarkdown = fs.readFileSync(path.join(docsDir(), file), "utf-8");
        const { frontmatter, content } = extractFrontmatter(rawMarkdown);
        const toc = extractToc(content);
        const html = String(await proc.process({ value: rawMarkdown, path: file }));
        return { slug, content, entry: { html, frontmatter, toc } };
      })
    );

    const docs: Record<string, DocEntry> = {};
    const searchData: SearchEntry[] = [];

    for (const { slug, content, entry } of processed) {
      docs[slug] = entry;
      searchData.push(extractSearchSections(content, slug, entry.frontmatter.title));
    }

    return { docs, searchData };
  }

  return {
    name: "lathe-docs",

    configResolved(config) {
      root = config.root;
      resolvedPublicDir = path.resolve(config.root, "public");
    },

    resolveId(id) {
      if (id === VIRTUAL_CONTENT) return RESOLVED_CONTENT;
      if (id === VIRTUAL_SEARCH) return RESOLVED_SEARCH;
      if (id === VIRTUAL_NAVIGATION) return RESOLVED_NAVIGATION;
      if (id === VIRTUAL_SHIKI_CSS) return RESOLVED_SHIKI_CSS;
    },

    async load(id) {
      if (id === RESOLVED_CONTENT) {
        const { docs } = await loadAllDocs();
        return `export const docs = ${JSON.stringify(docs)};`;
      }
      if (id === RESOLVED_SEARCH) {
        const { searchData } = await loadAllDocs();
        return `export const searchData = ${JSON.stringify(searchData)};`;
      }
      if (id === RESOLVED_NAVIGATION) {
        const { docs } = await loadAllDocs();
        return `export const navigation = ${JSON.stringify(buildNavigation(docs))};`;
      }
      if (id === RESOLVED_SHIKI_CSS) {
        // The class table only exists once every doc has been highlighted, so
        // await the same memoized pass the content module uses.
        await loadAllDocs();
        return styleToClass?.getCSS() ?? "";
      }
    },

    configureServer(server) {
      server.watcher.add(docsDir() + "/**/*.md");

      const reload = (filePath: string) => {
        if (!filePath.startsWith(docsDir()) || !filePath.endsWith(".md")) return;
        // Reset caches so Shiki re-initializes and classes are regenerated.
        invalidateDocs();
        for (const id of [RESOLVED_CONTENT, RESOLVED_SEARCH, RESOLVED_NAVIGATION]) {
          const mod = server.moduleGraph.getModuleById(id);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("change", reload);
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

