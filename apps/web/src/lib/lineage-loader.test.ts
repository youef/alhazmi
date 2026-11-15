import { describe, expect, it, vi } from 'vitest';
import { loadApprovedLineage } from './lineage-loader';
import type { PublicLineagePage, PublicUnit } from './diwan-api';

const unit = (id: string, parent_id: string | null = null): PublicUnit =>
  ({ id, parent_id, name_ar: id, name_en: null, unit_type: 'family' });
const page = (offset: number, nextOffset: number | null, data: PublicUnit[]): PublicLineagePage =>
  ({ data, meta: { offset, nextOffset, limit: 50, reviewStatus: 'approved' } });

describe('loadApprovedLineage', () => {
  it('loads every approved page and deduplicates overlapping units', async () => {
    const fetcher = vi.fn(async (offset: number) => {
      if (offset === 0) return page(0, 50, [unit('root'), unit('child', 'root')]);
      if (offset === 50) return page(50, null, [unit('child', 'root'), unit('second')]);
      throw new Error('Unexpected offset');
    });
    const onProgress = vi.fn();
    const result = await loadApprovedLineage(fetcher, onProgress);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.items.map(item => item.id)).toEqual(['root', 'child', 'second']);
    expect(result.nextOffset).toBeNull();
    expect(result.pagesLoaded).toBe(2);
    expect(onProgress).toHaveBeenLastCalledWith(result.items, null);
  });

  it('rejects a regressing cursor instead of looping indefinitely', async () => {
    await expect(loadApprovedLineage(async () => page(0, 0, [unit('a')]))).rejects.toThrow('INVALID_NEXT_OFFSET');
  });

  it('rejects a mismatched page and refuses a non-approved response', async () => {
    await expect(loadApprovedLineage(async () => page(50, null, []))).rejects.toThrow('INVALID_APPROVED_PAGE');
    const response = page(0, null, []);
    response.meta.reviewStatus = 'needs_review' as 'approved';
    await expect(loadApprovedLineage(async () => response)).rejects.toThrow('INVALID_APPROVED_PAGE');
  });

  it('preserves a continuation cursor when the safety limit is reached', async () => {
    const result = await loadApprovedLineage(
      async offset => page(offset, offset + 50, [unit(String(offset))]),
      undefined,
      2,
    );
    expect(result.pagesLoaded).toBe(2);
    expect(result.nextOffset).toBe(100);
    expect(result.items).toHaveLength(2);
  });
});
