/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'haseebclan.pythonanywhere.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
