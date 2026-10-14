import { Index } from "flexsearch";
import { searchData, type SearchEntry } from "virtual:docs/search-index";

export interface SearchResult {
  slug: string;
  pageTitle: string;
  sectionTitle: string;
  hash: string | null;
  content: string;
}

let index: Index | null = null;
let resultMap: Map<number, SearchResult> | null = null;

function getIndex(): { index: Index; map: Map<number, SearchResult> } {
  if (index && resultMap) {
    return { index, map: resultMap };
  }

  index = new Index({ tokenize: "forward", resolution: 9 });
  resultMap = new Map();

  let id = 0;
  for (const entry of searchData as SearchEntry[]) {
    for (const section of entry.sections) {
      const content = section.content.join(" ");
      const result: SearchResult = {
        slug: entry.slug,
        pageTitle: entry.title,
        sectionTitle: section.title,
        hash: section.hash,
        content,
      };
      resultMap.set(id, result);
      // Index both the section title and content
      index.add(id, `${section.title} ${content}`);
      id++;
    }
  }

  return { index, map: resultMap };
}

export function search(query: string, limit = 8): SearchResult[] {
  if (!query.trim()) return [];

  const { index: idx, map } = getIndex();
  const ids = idx.search(query, limit);
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const result = map.get(id as number);
    if (result) {
      // Deduplicate by slug+hash
      const key = `${result.slug}#${result.hash ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(result);
      }
    }
  }

  return results;
}
