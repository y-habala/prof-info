import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        // Our own pages must never be framed by a third-party site
        // (clickjacking / UI-redress) — see architecture doc §9. This is
        // unrelated to the html_pages sandbox itself (which protects us
        // from admin-authored content, not the other way around).
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Standard defense-in-depth headers — none of these interact with
          // the html_pages sandbox (that's the iframe's own `sandbox`
          // attribute, not an HTTP header) and none restrict anything this
          // app actually uses, so no functional testing needed unlike a
          // full script/style CSP would require (see architecture doc §9).
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
