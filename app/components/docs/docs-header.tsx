import type { NavGroup } from "~/lib/docs/navigation";

export function DocsHeader({
  title,
  description,
  navGroup,
}: {
  title: string;
  description?: string;
  navGroup?: NavGroup;
}) {
  return (
    <header className="max-w-2xl">
      {navGroup && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">
          {navGroup.title}
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
