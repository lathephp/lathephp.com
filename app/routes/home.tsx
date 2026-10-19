import { Link } from "react-router";
import { RiArrowRightLine } from "@remixicon/react";
import { LatheLogo } from "~/components/lathe-logo";
import { ThemeToggle } from "~/components/theme-toggle";
import { buttonVariants } from "~/components/ui/button";

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

// Each screenshot has a light and a dark file, swapped with the site's theme.
function Screenshot({ name, alt, height }: { name: string; alt: string; height: number }) {
  return (
    <div className="mt-12 overflow-hidden rounded-lg border border-border shadow-sm">
      <img src={`/images/home/${name}-light.png`} alt={alt} width={1440} height={height} className="doc-img-light h-auto w-full" />
      <img src={`/images/home/${name}-dark.png`} alt={alt} width={1440} height={height} className="doc-img-dark h-auto w-full" />
    </div>
  );
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
            <Link to="/docs" className={buttonVariants({ variant: "link", size: "sm", className: "text-muted-foreground" })}>
              Docs
            </Link>
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

        {/* Plain links styled as buttons: the Button component would give
            them role="button". */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/docs" className={buttonVariants({ size: "lg" })}>
            Read the docs
            <RiArrowRightLine data-icon="inline-end" />
          </Link>
        </div>

        <Screenshot name="orders" height={900} alt="The Orders list in Lathe: a table of orders with status badges, totals and dates, with search, filters and tabs above it" />
        <h2 className="mt-16 text-2xl font-semibold tracking-tight text-foreground">Dashboards</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          One range picker drives every card, and each user can arrange their own layout.
        </p>
        <Screenshot name="dashboard" height={560} alt="The Sales dashboard in Lathe: orders, revenue and paid orders cards above charts of orders per day and orders by status, with a 7 days, 30 days and 12 months range picker" />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          Lathe is open source under the MIT licence.
        </div>
      </footer>
    </div>
  );
}
