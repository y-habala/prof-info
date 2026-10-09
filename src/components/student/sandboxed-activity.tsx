"use client";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

// Interactive activity isolated in a sandboxed iframe.
// Auto-sizes to content height (via postMessage) and supports fullscreen.
export function SandboxedActivity({
  html,
  css,
  js,
}: {
  html: string;
  css: string;
  js: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for height reports from inside the iframe.
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

  // Track the browser fullscreen state so the button icon stays in sync
  // even when the user exits with Escape.
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const srcDoc = useMemo(
    () => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      html, body { margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; background: #fff; }
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
    <div ref={containerRef} style={{ position: "relative" }}>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{
          height: isFullscreen ? "100vh" : height,
          width: "100%",
          border: 0,
          display: "block",
          overflow: isFullscreen ? "auto" : "hidden",
          background: "#fff",
        }}
        title="Activité interactive"
        scrolling={isFullscreen ? "yes" : "no"}
      />
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
          cursor: "pointer",
          zIndex: 10,
          color: "#333",
        }}
      >
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
    </div>
  );
}
