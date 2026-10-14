// Checks that every internal href and src in the built HTML points at a file in
// dist/, and that every #anchor names an id on the page it points at.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "..", "dist");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// The built file a site path is served from, or null.
function resolve(pathname) {
  const file = path.join(dist, decodeURIComponent(pathname));
  if (!file.startsWith(dist)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  for (const candidate of [path.join(file, "index.html"), `${file}.html`]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const ids = new Map();
function hasId(file, id) {
  if (!ids.has(file)) {
    ids.set(file, new Set([...fs.readFileSync(file, "utf8").matchAll(/\sid="([^"]*)"/g)].map((m) => m[1])));
  }
  return ids.get(file).has(decodeURIComponent(id));
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
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(value) || value === "" || value === "#") continue;
    const url = new URL(value, `http://site${pageUrl}`);
    const file = value.startsWith("#") ? page : resolve(url.pathname);
    checked++;
    const hash = url.hash.slice(1);
    if (!file || (hash && !(file.endsWith(".html") && hasId(file, hash)))) {
      broken.push(`${path.relative(dist, page)}: ${attr}="${value}"`);
    }
  }
}

if (broken.length) {
  console.error(broken.join("\n"));
  console.error(`link check: ${broken.length} broken of ${checked}`);
  process.exit(1);
}
console.log(`link check: ok, ${checked} internal links in ${pages.length} pages`);
