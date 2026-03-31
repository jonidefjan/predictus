/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:3001';
    return [
      {
        source: '/registration/:path*',
        destination: `${backendUrl}/registration/:path*`,
      },
      {
        source: '/cep/:path*',
        destination: `${backendUrl}/cep/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
