import { Font } from "@react-pdf/renderer";
import path from "node:path";

const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

// Cairo covers Latin and Arabic, so titles, figures and the Arabic header
// lines share one typeface. Kalam / PatrickHand are the "teacher's pen".
Font.register({
  family: "Cairo",
  fonts: [
    { src: path.join(FONT_DIR, "Cairo-Regular.ttf") },
    { src: path.join(FONT_DIR, "Cairo-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Kalam",
  fonts: [{ src: path.join(FONT_DIR, "Kalam-Bold.ttf"), fontWeight: 700 }],
});
Font.register({
  family: "PatrickHand",
  fonts: [{ src: path.join(FONT_DIR, "PatrickHand-Regular.ttf") }],
});
// Words are never broken with hyphens in titles or names.
Font.registerHyphenationCallback((word) => [word]);
