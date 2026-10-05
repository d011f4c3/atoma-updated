import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  redirects() {
    return [
      { source: "/light", destination: "/", permanent: true },
      { source: "/dark", destination: "/", permanent: true },
      { source: "/shop/light", destination: "/shop", permanent: true },
      {
        source: "/shop/light/:handle",
        destination: "/shop/:handle",
        permanent: true,
      },
      { source: "/origins/light", destination: "/origins", permanent: true },
    ];
  },
};

export default nextConfig;
