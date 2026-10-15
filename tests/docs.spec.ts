import fs from "node:fs";
import { expect, test } from "@playwright/test";

// The sidebar lists one link per page of the docs folder the site was built from.
const docsDir = process.env.LATHE_DOCS_DIR;
if (!docsDir) throw new Error("Set LATHE_DOCS_DIR to the docs folder the site was built from.");
const docPages = fs.globSync("*/*.md", { cwd: docsDir }).map((file) => `/docs/${file.replace(/\.md$/, "")}`);
const pageCount = docPages.length;

test("the docs index shows a sidebar listing the pages", async ({ page }) => {
  await page.goto("/docs");
  const sidebar = page.getByRole("navigation", { name: "Docs" });
  await expect(sidebar.getByRole("link", { name: "Installation" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Configuration" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Commands" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Plugins", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("link")).toHaveCount(pageCount);
});

test("the configuration page lists limits.count_cap", async ({ page }) => {
  await page.goto("/docs/getting-started/configuration");
  await expect(page.getByRole("heading", { level: 1, name: "Configuration" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "limits.count_cap", exact: true })).toBeVisible();
});

test("the commands page lists lathe:doctor", async ({ page }) => {
  await page.goto("/docs/getting-started/commands");
  await expect(page.getByRole("heading", { level: 1, name: "Commands" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "lathe:doctor", exact: true })).toBeVisible();
});

test("Ctrl+K opens exactly one search dialog", async ({ page }) => {
  await page.goto("/docs/getting-started/installation");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  // A second modal dialog hides the first from the accessibility tree, so
  // count the dialog elements themselves.
  await expect(page.locator('[role="dialog"]')).toHaveCount(1);
});

// Cloudflare Pages may serve a page at /docs/x/y/ as well as /docs/x/y.
test("a page opened with a trailing slash is marked current", async ({ page }) => {
  await page.goto("/docs/getting-started/configuration/");
  await page.waitForLoadState("networkidle");
  const sidebar = page.getByRole("navigation", { name: "Docs" });
  await expect(sidebar.getByRole("link", { name: "Configuration" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /^Previous/ })).toHaveAttribute("href", "/docs/getting-started/deployment");
  await expect(page.getByRole("link", { name: /^Next/ })).toHaveAttribute("href", "/docs/getting-started/commands");
});

test("the landing page links to the docs and the benchmarks, and not to the parked demo", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Lathe, an admin panel builder for Laravel");
  await expect(page.locator('a[href="/docs"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://github.com/lathephp/benchmarks"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://demo.lathephp.com"]')).toHaveCount(0);
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("no page scrolls sideways", async ({ page }) => {
    const wide: string[] = [];
    for (const path of ["/", "/docs", ...docPages]) {
      await page.goto(path);
      const [scrollWidth, innerWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      if (scrollWidth > innerWidth) wide.push(`${path}: ${scrollWidth}px`);
    }
    expect(wide).toEqual([]);
  });
});

test("the landing and header links are links, not buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Benchmark results" })).toHaveAttribute("href", "https://github.com/lathephp/benchmarks");
  await expect(page.getByRole("link", { name: "Read the docs" })).toHaveAttribute("href", "/docs");
  await page.goto("/docs");
  await expect(page.locator('a[href="https://demo.lathephp.com"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Benchmarks", exact: true })).toHaveAttribute("href", "https://github.com/lathephp/benchmarks");
});
