import type { NextConfig } from 'next';

const pages = process.env.GITHUB_PAGES === 'true';
const basePath = pages ? '/alhazmi' : '';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
export default nextConfig;
