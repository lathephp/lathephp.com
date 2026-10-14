import { Link } from "react-router";
import { RiArrowRightLine, RiBarChartLine, RiPlayLine } from "@remixicon/react";
import { LatheLogo } from "~/components/lathe-logo";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";

const title = "Lathe, an admin panel builder for Laravel";
const description =
  "Lathe builds an admin panel for your Laravel app from Resource classes, on Inertia, React and shadcn/ui.";

export function meta() {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Lathe home">
            <LatheLogo />
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="link" size="sm" className="text-muted-foreground" nativeButton={false} render={<Link to="/docs">Docs</Link>} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
        <LatheLogo size="large" />
        <h1 className="mt-8 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          An admin panel builder for Laravel
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" nativeButton={false} render={<Link to="/docs" />}>
            Read the docs
            <RiArrowRightLine data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<a href="https://demo.lathephp.com" />}>
            <RiPlayLine data-icon="inline-start" />
            Try the demo
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<a href="https://github.com/lathephp/benchmarks" />}>
            <RiBarChartLine data-icon="inline-start" />
            Benchmark results
          </Button>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          Lathe is open source under the MIT licence.
        </div>
      </footer>
    </div>
  );
}
