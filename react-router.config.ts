import type { Config } from "@react-router/dev/config";
import { listDocSlugs, resolveDocsDir } from "./app/lib/docs/docs-source";

export default {
  // No runtime server: every page is written to static HTML at build time.
  ssr: false,
  async prerender() {
    const slugs = listDocSlugs(resolveDocsDir());
    return ["/", "/docs", ...slugs.map((slug) => `/docs/${slug}`)];
  },
} satisfies Config;
