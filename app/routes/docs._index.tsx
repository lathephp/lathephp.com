import { Link } from "react-router";
import { navigation } from "~/lib/docs/navigation";
import { DocsHeader } from "~/components/docs/docs-header";
import { Separator } from "~/components/ui/separator";

export function meta() {
  return [
    { title: "Lathe docs" },
    { name: "description", content: "Documentation for Lathe, an admin panel builder for Laravel." },
  ];
}

// A static host has no redirects to send /docs to the first page, so /docs
// is an overview of every section.
export default function DocsIndex() {
  return (
    <article className="max-w-3xl">
      <DocsHeader
        title="Lathe docs"
        description="Install Lathe, build your first resource, then organize, secure and extend your admin panel."
      />
      <Separator className="mt-8" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {navigation.map((group) => (
          <section key={group.title}>
            <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-brand">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
