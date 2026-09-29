"use client";

function buildSrcDoc(html: string, css: string, js: string): string {
  // Inline content only — no external <script src> injected by us, and
  // nothing here ever runs with allow-same-origin (see the iframe below).
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;
}

export function SandboxedActivity({
  html,
  css,
  javascript,
}: {
  html: string;
  css: string;
  javascript: string;
}) {
  return (
    <iframe
      // Deliberately NOT combined with allow-same-origin: that combination
      // would let the frame's script strip its own sandbox restrictions.
      // Without it, this content gets an opaque origin — it cannot read or
      // write our cookies, localStorage, or parent DOM no matter what the
      // script does. See architecture doc §9 for the full reasoning
      // (network egress isn't blocked by this, only same-origin access).
      sandbox="allow-scripts"
      srcDoc={buildSrcDoc(html, css, javascript)}
      title="Activité interactive"
      className="h-[600px] w-full rounded-md border bg-white"
    />
  );
}
