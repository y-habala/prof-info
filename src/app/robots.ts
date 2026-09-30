import type { MetadataRoute } from "next";

// Almost every route requires an access code (see middleware.ts) and isn't
// meant to be publicly indexed even where it technically loads — this is a
// private school platform, not public content. No sitemap either, for the
// same reason: nothing here should be discoverable via search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
