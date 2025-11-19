/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
  transpilePackages: ['@multiversx/sdk-dapp-ui'],
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also disable TypeScript errors during builds (optional)
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding', {
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate'
    });

    return config;
  }
};

module.exports = nextConfig;
