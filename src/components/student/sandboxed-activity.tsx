"use client";
import { useMemo, useRef, useState, useEffect } from "react";

// Interactive activity isolated in a sandboxed iframe.
// The iframe reports its scroll height via postMessage so the parent can
// size it to fit — no scrollbar, no fixed cap, reads like a normal page.
export function SandboxedActivity({
  html,
  css,
  js,
}: {
  html: string;
  css: string;
  js: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (
        typeof e.data === "object" &&
        e.data !== null &&
        e.data.type === "iframe-resize" &&
        typeof e.data.height === "number"
      ) {
        setHeight(Math.max(100, e.data.height));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const srcDoc = useMemo(
    () => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      html, body { margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; background: transparent; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      (function(){
        try { ${js} } catch(e) {
          var err = document.createElement('pre');
          err.style.cssText = 'color:#c00;background:#fef2f2;padding:.5rem;border:1px solid #fee;border-radius:.25rem;white-space:pre-wrap;';
          err.textContent = 'JS error: ' + (e && e.message ? e.message : e);
          document.body.appendChild(err);
        }
        function send() {
          window.parent.postMessage({ type: 'iframe-resize', height: document.documentElement.scrollHeight }, '*');
        }
        if (typeof ResizeObserver !== 'undefined') {
          new ResizeObserver(send).observe(document.documentElement);
        }
        window.addEventListener('load', send);
        send();
      })();
    </script>
  </body>
</html>`,
    [html, css, js]
  );

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ height, width: "100%", border: 0, display: "block", overflow: "hidden" }}
      title="Activité interactive"
      scrolling="no"
    />
  );
}
