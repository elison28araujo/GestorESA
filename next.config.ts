import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Para abrir o painel pelo IP da rede (10.0.0.137) sem warnings de CORS no dev
  allowedDevOrigins: ["http://10.0.0.137:3000", "http://localhost:3000"],

  // Permitir imagens remotas usadas no projeto (ex: picsum.photos)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;