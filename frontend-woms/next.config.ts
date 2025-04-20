/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/dashboard/:path*",
        destination: "/",
      },
    ];
  },
};

module.exports = nextConfig;
