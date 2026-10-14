import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LATHE_REPO = "https://github.com/lathephp/lathe.git";

/**
 * The docs/ folder the site is built from. LATHE_DOCS_DIR names a local
 * folder; otherwise LATHE_DOCS_REF names a tag or branch of lathephp/lathe,
 * and the build fetches only that ref's docs/ into .docs-cache/.
 */
export function resolveDocsDir(root = process.cwd()): string {
  const local = process.env.LATHE_DOCS_DIR;
  if (local) {
    const dir = path.resolve(root, local);
    if (!fs.existsSync(dir)) throw new Error(`LATHE_DOCS_DIR ${dir} does not exist`);
    return dir;
  }

  const ref = process.env.LATHE_DOCS_REF;
  if (!ref) {
    throw new Error(
      "Set LATHE_DOCS_DIR to a local docs folder, or LATHE_DOCS_REF to a tag or branch of lathephp/lathe."
    );
  }

  // The route config and the Vite plugin both call this in one build, so the
  // second call reuses the first one's checkout. `pnpm build` clears the cache.
  const checkout = path.join(root, ".docs-cache", ref.replace(/[^\w.-]/g, "_"));
  if (!fs.existsSync(path.join(checkout, "docs"))) {
    fs.rmSync(checkout, { recursive: true, force: true });
    execFileSync(
      "git",
      ["clone", "--depth", "1", "--branch", ref, "--filter=blob:none", "--sparse", LATHE_REPO, checkout],
      { stdio: "inherit" }
    );
    execFileSync("git", ["-C", checkout, "sparse-checkout", "set", "docs"], { stdio: "inherit" });
  }
  return path.join(checkout, "docs");
}

/** Every page as "<folder>/<name>", from docs/<folder>/<name>.md. */
export function listDocSlugs(docsDir: string): string[] {
  return fs
    .globSync("*/*.md", { cwd: docsDir })
    .map((file) => file.replace(/\.md$/, ""))
    .sort();
}
