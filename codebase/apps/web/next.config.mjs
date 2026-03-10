/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@company-builder/types', '@company-builder/database', '@company-builder/core'],
};

export default nextConfig;
