// Your Markdown renderer. See the README for what it must handle; the tests are the spec.

export function escapeHtml(text: string): string {
  throw new Error(`TODO: escapeHtml(${text})`);
}

export function inline(text: string): string {
  throw new Error(`TODO: inline(${text})`);
}

export function markdownToHtml(markdown: string): string {
  throw new Error(`TODO: markdownToHtml(${markdown.length} characters)`);
}

export function plainText(markdown: string): string {
  throw new Error(`TODO: plainText(${markdown.length} characters)`);
}
