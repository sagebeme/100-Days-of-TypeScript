// A small, safe Markdown: enough for a blog. Every piece of text is HTML-escaped before it's wrapped
// in tags, so a post can't smuggle in a <script>. Links only go to http(s), mailto or relative paths.

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed) || /^[/#.]/.test(trimmed) || /^[\w-]+(\/[\w.-]*)*(\.\w+)?$/.test(trimmed)) return trimmed;
  return null; // javascript:, data: and friends
}

// **bold**, *emphasis*, `code`, [text](url), ![alt](src). Code spans are protected first, so their
// contents stay literal.
export function inline(text: string): string {
  const codes: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = escapeHtml(out);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, alt: string, src: string) => {
    const url = safeUrl(src.replace(/&amp;/g, "&"));
    return url ? `<img src="${escapeHtml(url)}" alt="${alt}" loading="lazy">` : whole;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, href: string) => {
    const url = safeUrl(href.replace(/&amp;/g, "&"));
    return url ? `<a href="${escapeHtml(url)}">${label}</a>` : label;
  });
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  const isBlank = (line: string | undefined) => line === undefined || line.trim() === "";

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    const fence = /^```\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++; // the closing fence
      const lang = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      html.push(`<pre><code${lang}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (heading) {
      html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      html.push("<hr>");
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote>${markdownToHtml(quote.join("\n"))}</blockquote>`);
      continue;
    }
    const listItem = /^\s*([-*]|\d+\.)\s+(.*)$/;
    const list = listItem.exec(line);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const items: string[] = [];
      while (i < lines.length && listItem.test(lines[i])) items.push(`<li>${inline(listItem.exec(lines[i++])![2])}</li>`);
      html.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && !isBlank(lines[i]) && !/^(#{1,6}\s|```|>|\s*([-*]|\d+\.)\s|(-{3,}|\*{3,})\s*$)/.test(lines[i])) paragraph.push(lines[i++].trim());
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
  }
  return html.join("\n");
}

// Plain text, for reading time and summaries.
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links: keep the words
    .replace(/^\s*(#{1,6}|>|[-*]|\d+\.|-{3,}|\*{3,})\s*/gm, "") // markers at the start of a line
    .replace(/[*`_]/g, "") // emphasis and code marks
    .replace(/\s+/g, " ")
    .trim();
}
