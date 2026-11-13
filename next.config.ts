import type { NextConfig } from "next";
import { getSecurityHeaders } from "./lib/security/securityHeaders";

const nextConfig: NextConfig = {
  /* config options here */
  // 응답 헤더에서 "X-Powered-By: Next.js"를 빼 사용 기술을 드러내지 않는다
  poweredByHeader: false,
  // 모든 응답에 보안 헤더를 붙인다 (lib/security/securityHeaders.ts)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(process.env.NODE_ENV === "production"),
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
