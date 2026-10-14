// Builds the site from a local docs folder and checks that dist/ holds plain
// static pages with no server bundle.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const failures = [];

if (!process.env.LATHE_DOCS_DIR) {
  console.error("Set LATHE_DOCS_DIR to the docs/ folder of lathephp/lathe.");
  process.exit(1);
}

const build = spawnSync("pnpm", ["build"], { cwd: root, stdio: "inherit" });
if (build.status !== 0) {
  console.error(`pnpm build exited ${build.status}`);
  process.exit(1);
}

for (const page of [
  "index.html",
  "docs/index.html",
  "docs/getting-started/configuration/index.html",
  "docs/getting-started/commands/index.html",
  "favicon.svg",
]) {
  if (!fs.existsSync(path.join(dist, page))) failures.push(`missing dist/${page}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = fs.existsSync(dist) ? walk(dist) : [];
for (const file of files) {
  const rel = path.relative(dist, file);
  // A static host serves files only; scripts outside assets/ would be server code.
  if (rel.startsWith("server") || rel === "_worker.js" || (rel.endsWith(".js") && !rel.startsWith("assets/"))) {
    failures.push(`server code in dist/${rel}`);
  }
  // The product is never named as if it were part of Laravel. The class keeps
  // the two words apart, so the word check does not flag this file.
  if (rel.endsWith(".html") && /Laravel[\s]+Lathe/.test(fs.readFileSync(file, "utf8"))) {
    failures.push(`dist/${rel} names the product as if it were part of Laravel`);
  }
}

const landing = path.join(dist, "index.html");
if (fs.existsSync(landing)) {
  const title = fs.readFileSync(landing, "utf8").match(/<title>([^<]*)<\/title>/)?.[1];
  if (title !== "Lathe, an admin panel builder for Laravel") {
    failures.push(`landing title is ${JSON.stringify(title)}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`build smoke: ${failures.length} failures`);
  process.exit(1);
}
console.log(`build smoke: ok, ${files.length} files in dist/`);
