"use client";
import { useMemo } from "react";

// Interactive activity isolated in a sandboxed iframe:
//   - sandbox="allow-scripts" (NO allow-same-origin — the iframe gets an
//     opaque origin and cannot read cookies, storage, or the parent DOM)
//   - no allow-popups / allow-top-navigation / allow-forms by default
//   - srcDoc assembled client-side from the admin-authored HTML/CSS/JS
export function SandboxedActivity({
  html,
  css,
  js,
  height = 400,
}: {
  html: string;
  css: string;
  js: string;
  height?: number;
}) {
  const srcDoc = useMemo(() => {
    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body { margin: 0; padding: 1rem; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; background: #fff; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      (function(){
        try {
          ${js}
        } catch (e) {
          const err = document.createElement('pre');
          err.style.cssText = 'color:#c00;background:#fef2f2;padding:0.5rem;border:1px solid #fee;border-radius:0.25rem;white-space:pre-wrap;';
          err.textContent = 'JS error: ' + (e && e.message ? e.message : e);
          document.body.appendChild(err);
        }
      })();
    </script>
  </body>
</html>`;
  }, [html, css, js]);

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ height, width: "100%", border: 0, borderRadius: "0.5rem", backgroundColor: "white" }}
      title="Activité interactive"
    />
  );
}
