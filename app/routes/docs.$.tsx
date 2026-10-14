import type { Route } from "./+types/docs.$";
import { docs } from "virtual:docs/content";
import { findNavGroup } from "~/lib/docs/navigation";
import { Prose } from "~/components/docs/docs-prose";
import { TableOfContents } from "~/components/docs/docs-toc";
import { PrevNextLinks } from "~/components/docs/docs-prev-next";
import { DocsHeader } from "~/components/docs/docs-header";
import { Separator } from "~/components/ui/separator";

// --- Loader ---

// Runs at build time only: the prerender writes each page's HTML and data,
// so the docs content never ships in the client bundle.
export function loader({ params }: Route.LoaderArgs) {
  const slug = params["*"] ?? "";
  const doc = docs[slug];
  if (!doc) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    slug,
    html: doc.html,
    frontmatter: doc.frontmatter,
    toc: doc.toc,
  };
}

// --- Meta ---

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [];
  const title = `${data.frontmatter.title} - Lathe docs`;
  const description =
    data.frontmatter.description ?? "Documentation for Lathe, an admin panel builder for Laravel.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

// --- Page Component ---

export default function DocsPage({ loaderData }: Route.ComponentProps) {
  const data = loaderData;
  const navGroup = findNavGroup(`/docs/${data.slug}`);

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1 max-w-3xl">
        <DocsHeader
          title={data.frontmatter.title}
          description={data.frontmatter.description}
          navGroup={navGroup}
        />

        <Separator className="mt-8" />

        <Prose
          className="mt-8"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />

        <PrevNextLinks />
      </article>

      <TableOfContents toc={data.toc} />
    </div>
  );
}
