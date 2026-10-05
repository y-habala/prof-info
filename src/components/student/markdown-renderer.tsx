import { Fragment } from "react";

// Minimal safe markdown renderer. Admin-authored, so XSS risk is low, but
// we still render through React (no dangerouslySetInnerHTML) and only
// support a well-defined subset. Keeps the dep tree small — no react-markdown
// / remark / rehype needed for v2.
//
// Supported:
//   # / ## / ###        → h1 / h2 / h3
//   plain line          → <p>
//   - / * / 1.          → <ul> / <ol>
//   > …                 → <blockquote>
//   ---                 → <hr>
//   ```lang\n…\n```     → <pre><code>
//   **bold**            → <strong>
//   *italic*            → <em>
//   `code`              → <code>
//   [text](url)         → <a> (http(s) + mailto only)
//   ![alt](url)         → <img> (http(s) only)
//
// Anything else is rendered as plain text — e.g. raw <html> never slips through.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Tokenize inline: bold, italic, code, links, images. Simple left-to-right
  // scan; nesting is intentionally not supported (keeps parser predictable).
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  const key = () => `${keyPrefix}-${keyCounter++}`;

  while (i < text.length) {
    const rest = text.slice(i);

    // Image: ![alt](url)
    const imgMatch = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/.exec(rest);
    if (imgMatch) {
      // eslint-disable-next-line @next/next/no-img-element
      nodes.push(<img key={key()} src={imgMatch[2]} alt={imgMatch[1]} />);
      i += imgMatch[0].length;
      continue;
    }

    // Link: [text](url)
    const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/.exec(rest);
    if (linkMatch) {
      nodes.push(
        <a key={key()} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
          {linkMatch[1]}
        </a>
      );
      i += linkMatch[0].length;
      continue;
    }

    // Code span: `…`
    const codeMatch = /^`([^`]+)`/.exec(rest);
    if (codeMatch) {
      nodes.push(<code key={key()}>{codeMatch[1]}</code>);
      i += codeMatch[0].length;
      continue;
    }

    // Bold: **…**
    const boldMatch = /^\*\*([^*]+)\*\*/.exec(rest);
    if (boldMatch) {
      nodes.push(<strong key={key()}>{boldMatch[1]}</strong>);
      i += boldMatch[0].length;
      continue;
    }

    // Italic: *…*
    const italicMatch = /^\*([^*]+)\*/.exec(rest);
    if (italicMatch) {
      nodes.push(<em key={key()}>{italicMatch[1]}</em>);
      i += italicMatch[0].length;
      continue;
    }

    // Plain run — take until the next special character.
    const nextSpecial = rest.search(/[*`[!]/);
    const chunk = nextSpecial === -1 ? rest : rest.slice(0, Math.max(1, nextSpecial));
    nodes.push(chunk);
    i += chunk.length;
  }
  return nodes;
}

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "hr" }
  | { type: "code"; lang: string | null; content: string };

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line separates blocks
    if (!trimmed) {
      i++;
      continue;
    }

    // Code fence
    const fenceMatch = /^```(\w*)\s*$/.exec(trimmed);
    if (fenceMatch) {
      const lang = fenceMatch[1] || null;
      const content: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        content.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ type: "code", lang, content: content.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const hMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (hMatch) {
      blocks.push({ type: "h", level: hMatch[1].length as 1 | 2 | 3, text: hMatch[2] });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      const qlines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        qlines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", lines: qlines });
      continue;
    }

    // Paragraph (consume consecutive non-blank non-special lines)
    const plines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^(#{1,3})\s+/.test(t)) break;
      if (/^[-*]\s+/.test(t)) break;
      if (/^\d+\.\s+/.test(t)) break;
      if (/^>\s?/.test(t)) break;
      if (/^```/.test(t)) break;
      if (/^(-{3,}|_{3,}|\*{3,})$/.test(t)) break;
      plines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", lines: plines });
  }
  return blocks;
}

export function MarkdownRenderer({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="markdown-content">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h":
            if (block.level === 1) return <h1 key={idx}>{renderInline(block.text, `h1-${idx}`)}</h1>;
            if (block.level === 2) return <h2 key={idx}>{renderInline(block.text, `h2-${idx}`)}</h2>;
            return <h3 key={idx}>{renderInline(block.text, `h3-${idx}`)}</h3>;
          case "hr":
            return <hr key={idx} className="my-6 border-border" />;
          case "ul":
            return (
              <ul key={idx}>
                {block.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ul-${idx}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx}>
                {block.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ol-${idx}-${j}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={idx}>
                {block.lines.map((l, j) => (
                  <Fragment key={j}>
                    {renderInline(l, `q-${idx}-${j}`)}
                    {j < block.lines.length - 1 ? <br /> : null}
                  </Fragment>
                ))}
              </blockquote>
            );
          case "code":
            return (
              <pre key={idx}>
                <code>{block.content}</code>
              </pre>
            );
          case "p":
            return (
              <p key={idx}>
                {block.lines.map((l, j) => (
                  <Fragment key={j}>
                    {renderInline(l, `p-${idx}-${j}`)}
                    {j < block.lines.length - 1 ? <br /> : null}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
