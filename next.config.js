/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/data/common/mobile_logo_img',
        destination: '/data/common/mobile_logo_img.png',
      },
      {
        source: '/data/banner/1',
        destination: '/data/banner/1.png',
      },
      {
        source: '/data/banner/2',
        destination: '/data/banner/2.png',
      },
    ];
  },
};

module.exports = nextConfig;
