import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

// Only enable Sentry in production when not building with OpenNext
const isSentryEnabled =
  process.env.NODE_ENV === 'production' && !process.env.OPEN_NEXT_BUILD;

export default isSentryEnabled
  ? require('@sentry/nextjs').withSentryConfig(nextConfig, {
      silent: true,
      org: 'aiready',
      project: 'clawmore',
    })
  : nextConfig;
