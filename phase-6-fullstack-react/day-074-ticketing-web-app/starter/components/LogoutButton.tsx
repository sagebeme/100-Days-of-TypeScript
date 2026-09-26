"use client";

import { useRouter } from "next/navigation";

// Already written: logging out is a POST (never a link: a link could be followed by accident, or by
// a page on another site). Then the page is re-rendered on the server, now as nobody.
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="link-button"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
