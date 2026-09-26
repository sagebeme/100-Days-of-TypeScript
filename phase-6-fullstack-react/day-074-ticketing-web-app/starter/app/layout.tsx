import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getViewer } from "../server/viewer.ts";
import { LogoutButton } from "../components/LogoutButton.tsx";
import "./tikiti.css";

// Already written: the frame around every page. The header knows who's signed in, because the
// layout is a server component that reads the session cookie before the page is sent.
export const metadata: Metadata = {
  title: { default: "Tikiti · What's on in Nairobi", template: "%s · Tikiti" },
  description: "Tickets for gigs, comedy and parties in Nairobi. Pay with M-Pesa.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121016" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
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
              {viewer && <Link href="/tickets">My tickets</Link>}
            </nav>
            <div className="account">
              {viewer ? (
                <>
                  <span className="account-name">{viewer.name.split(" ")[0]}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link className="button button-small" href="/login">
                  Log in
                </Link>
              )}
            </div>
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
