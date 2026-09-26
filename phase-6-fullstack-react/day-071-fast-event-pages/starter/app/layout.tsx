import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./tikiti.css";

// Already written: the frame around every page. Its metadata is the default; each page adds its own,
// and "%s · Tikiti" turns a page's "Jioni Jazz Night" into "Jioni Jazz Night · Tikiti".
export const metadata: Metadata = {
  metadataBase: new URL("https://tikiti.example"),
  title: { default: "Tikiti · What's on in Nairobi", template: "%s · Tikiti" },
  description: "Tickets for gigs, comedy and parties in Nairobi. Pay with M-Pesa.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121016" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link className="logo" href="/">
              <span className="logo-mark" aria-hidden="true">t</span>
              tikiti
            </Link>
            <nav className="site-nav" aria-label="Main">
              <Link href="/">What's on</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">Tikiti is a practice project from 100 Days of TypeScript. Events and acts are made up.</div>
        </footer>
      </body>
    </html>
  );
}
