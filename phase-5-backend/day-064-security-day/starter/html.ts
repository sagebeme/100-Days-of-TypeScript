export interface Review {
  id: number;
  vendor: string;
  author: string;
  body: string;
  stars: number;
}

// HOLE 2 is here. Every piece of user text that goes into HTML should go through escapeHtml.
export function escapeHtml(text: string): string {
  // TODO: replace & < > " and ' with &amp; &lt; &gt; &quot; &#39; (the & first!)
  return text;
}

export function reviewsPage(reviews: Review[]): string {
  const items = reviews
    .map(
      (r) => `      <li>
        <h2>${r.vendor} <span class="stars">${"★".repeat(r.stars)}</span></h2>
        <p>${r.body}</p>
        <p class="author">by ${r.author}</p>
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
