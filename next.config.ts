import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { getAllowedDevOriginHosts } from './src/lib/dev-origins';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,
  },
  allowedDevOrigins: getAllowedDevOriginHosts(),
};

export default withNextIntl(nextConfig);
