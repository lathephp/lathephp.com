import fs from "node:fs";
import { expect, test } from "@playwright/test";

// The sidebar lists one link per page of the docs folder the site was built from.
const docsDir = process.env.LATHE_DOCS_DIR;
if (!docsDir) throw new Error("Set LATHE_DOCS_DIR to the docs folder the site was built from.");
const pageCount = fs.globSync("*/*.md", { cwd: docsDir }).length;

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

test("the landing page links to the docs, the benchmarks and the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Lathe, an admin panel builder for Laravel");
  await expect(page.locator('a[href="/docs"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://github.com/lathephp/benchmarks"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://demo.lathephp.com"]').first()).toBeVisible();
});
