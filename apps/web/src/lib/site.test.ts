import { describe, expect, it } from 'vitest';
import { assetUrl, publicPaths } from './site';

describe('site helpers', () => {
  it('builds asset URLs with a leading slash', () => {
    expect(assetUrl('/brand/diwan-emblem.webp')).toMatch(/\/brand\/diwan-emblem\.webp$/);
    expect(assetUrl('brand/x.webp')).toMatch(/\/brand\/x\.webp$/);
  });
  it('lists every public page for both locales exactly once', () => {
    const paths = publicPaths();
    expect(paths).toHaveLength(10);
    expect(new Set(paths).size).toBe(10);
    expect(paths).toContain('/ar/lineage/');
    expect(paths).toContain('/en/');
  });
});
