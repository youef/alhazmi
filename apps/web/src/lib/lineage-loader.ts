import type { PublicLineagePage, PublicUnit } from './diwan-api';

type PageFetcher = (offset: number) => Promise<PublicLineagePage>;

export type CompleteLineageResult = {
  items: PublicUnit[];
  nextOffset: number | null;
  pagesLoaded: number;
};

/**
 * Fetch only the server-reviewed, public lineage directory.
 * Cursor checks prevent stale/malformed responses from trapping the UI in a loop.
 * A hard cap prevents unbounded work on very large genealogies.
 */
export async function loadApprovedLineage(
  fetchPage: PageFetcher,
  onProgress?: (units: PublicUnit[], nextOffset: number | null) => void,
  maxPages = 25,
): Promise<CompleteLineageResult> {
  if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 25) {
    throw new Error('INVALID_PAGE_LIMIT');
  }

  const indexed = new Map<string, PublicUnit>();
  const visited = new Set<number>();
  let nextOffset: number | null = 0;
  let pagesLoaded = 0;

  while (nextOffset !== null && pagesLoaded < maxPages) {
    const offset: number = nextOffset;
    if (visited.has(offset)) throw new Error('PAGINATION_LOOP');
    visited.add(offset);
    const page = await fetchPage(offset);
    if (page.meta.reviewStatus !== 'approved' || page.meta.offset !== offset) {
      throw new Error('INVALID_APPROVED_PAGE');
    }
    const next = page.meta.nextOffset;
    if (next !== null && (!Number.isSafeInteger(next) || next <= offset)) {
      throw new Error('INVALID_NEXT_OFFSET');
    }
    for (const unit of page.data) {
      if (!unit || typeof unit.id !== 'string' || !unit.id) throw new Error('INVALID_UNIT');
      indexed.set(unit.id, unit);
    }
    pagesLoaded++;
    nextOffset = next;
    onProgress?.([...indexed.values()], next);
  }

  return { items: [...indexed.values()], nextOffset, pagesLoaded };
}
