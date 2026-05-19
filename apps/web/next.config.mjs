import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nxinmall/database", "@nxinmall/constants", "@nxinmall/types", "@nxinmall/validators"],
  async rewrites() {
    const api = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
};

export default withNextIntl(nextConfig);
