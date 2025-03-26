/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Additional configuration can go here

  // Webpack configuration if needed
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

export default nextConfig;
