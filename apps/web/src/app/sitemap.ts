import type { MetadataRoute } from 'next';
import { publicPaths, siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths().map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: 'weekly', priority: path.endsWith('/ar/') || path.endsWith('/en/') ? 1 : 0.7 }));
}
