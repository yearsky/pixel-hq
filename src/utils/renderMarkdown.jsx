/**
 * Lightweight Markdown renderer for agent chat bubbles.
 * Supports: **bold**, *italic*, # headers, - bullet lists, numbered lists, blank-line paragraphs.
 * No external dependencies.
 */

function parseInline(text) {
  // **bold** → <strong>, *italic* → <em>
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} style={{ color: "#fff", fontWeight: 800 }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines as separators
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading: ## or #
    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^(#{1,3})/)[1].length;
      const content = line.replace(/^#{1,3}\s+/, "");
      const sizes = { 1: "18px", 2: "15px", 3: "13px" };
      elements.push(
        <div key={i} style={{ fontSize: sizes[level], fontWeight: 800, color: "#e2e8f0", marginTop: 10, marginBottom: 4, borderBottom: level === 1 ? "1px solid #334155" : "none", paddingBottom: level === 1 ? 4 : 0 }}>
          {parseInline(content)}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list block: collect consecutive "- " or "* " lines
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6, listStyleType: "disc" }}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list block: collect consecutive "1. " "2. " etc
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6 }}>
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: "4px 0", fontSize: "14px", color: "#f1f5f9", lineHeight: 1.65 }}>
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{elements}</div>;
}
