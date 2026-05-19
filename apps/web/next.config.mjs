import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nxinmall/database", "@nxinmall/constants", "@nxinmall/types", "@nxinmall/validators"],
  async rewrites() {
    // Sem API_PROXY_TARGET (ex.: só web na Vercel), rotas em app/api/v1/* respondem no próprio Next.js.
    const api = process.env.API_PROXY_TARGET?.trim();
    if (!api) return [];
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
};

export default withNextIntl(nextConfig);
