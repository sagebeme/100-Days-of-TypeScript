export interface Review {
  id: number;
  vendor: string;
  author: string;
  body: string;
  stars: number;
}

// Every piece of user text that goes into HTML goes through this. No exceptions, no "this field is safe".
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function reviewsPage(reviews: Review[]): string {
  const items = reviews
    .map(
      (r) => `      <li>
        <h2>${escapeHtml(r.vendor)} <span class="stars">${"★".repeat(r.stars)}</span></h2>
        <p>${escapeHtml(r.body)}</p>
        <p class="author">by ${escapeHtml(r.author)}</p>
      </li>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Street food reviews</title></head>
  <body>
    <h1>Street food reviews</h1>
    <ul>
${items}
    </ul>
  </body>
</html>`;
}
