/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "fontkit"],
  },
};

export default nextConfig;
