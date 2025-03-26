/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // If you're using NextAuth with a static export, you might need to remove API routes
  // or handle authentication differently

  // Disable server-side rendering for the NextAuth route
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
