import { locales, type Locale } from './i18n';

/** Public origin of the static site. Change here if a custom domain is attached. */
export const siteOrigin = 'https://youef.github.io';
/** '/alhazmi' on GitHub Pages builds, '' locally. Injected by next.config.ts. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const siteUrl = `${siteOrigin}${basePath}`;
export const repositoryUrl = 'https://github.com/youef/alhazmi';
export const memberPortalUrl = 'https://br-flat-boat-azy2ouq3-diwanmembers.compute.c-3.ap-southeast-1.aws.neon.tech/dashboard';

/** Prefix a /public asset path so it works under a GitHub Pages sub-path and locally. */
export function assetUrl(path: string) {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

export const publicSections = ['', 'branches', 'lineage', 'history', 'archive'] as const;

export function publicPaths(list: readonly Locale[] = locales) {
  return list.flatMap((locale) => publicSections.map((section) => `/${locale}/${section ? `${section}/` : ''}`));
}
