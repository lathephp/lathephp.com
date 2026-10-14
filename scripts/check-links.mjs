// Checks that every internal href and src in the built HTML points at a file in dist/.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "..", "dist");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function resolves(target) {
  const clean = decodeURIComponent(target.replace(/[#?].*$/, ""));
  const file = path.join(dist, clean);
  if (!file.startsWith(dist)) return false;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return true;
  return fs.existsSync(path.join(file, "index.html")) || fs.existsSync(`${file}.html`);
}

const pages = fs.existsSync(dist) ? walk(dist).filter((file) => file.endsWith(".html")) : [];
if (pages.length === 0) {
  console.error("link check: no HTML in dist/, run pnpm build first");
  process.exit(1);
}

const broken = [];
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const pageUrl = "/" + path.relative(dist, path.dirname(page)) + "/";
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value) || value === "") continue;
    const target = new URL(value, `http://site${pageUrl}`).pathname;
    checked++;
    if (!resolves(target)) broken.push(`${path.relative(dist, page)}: ${attr}="${value}"`);
  }
}

if (broken.length) {
  console.error(broken.join("\n"));
  console.error(`link check: ${broken.length} broken of ${checked}`);
  process.exit(1);
}
console.log(`link check: ok, ${checked} internal links in ${pages.length} pages`);
