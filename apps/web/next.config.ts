import type { NextConfig } from 'next';

const pages = process.env.GITHUB_PAGES === 'true';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'export',
  trailingSlash: true,
  basePath: pages ? '/alhazmi' : '',
  images: { unoptimized: true },
};
export default nextConfig;
