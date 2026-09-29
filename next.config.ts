import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
