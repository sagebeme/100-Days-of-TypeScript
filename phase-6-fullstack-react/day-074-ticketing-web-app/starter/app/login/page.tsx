import type { Metadata } from "next";
import { AuthForm } from "./AuthForm.tsx";
import { SEED_ACCOUNTS } from "../../server/seed.ts";

export const metadata: Metadata = { title: "Log in" };

// Already written. ?next=/events/2 sends people back where they were once they're in. Only paths on
// this site are allowed: "?next=https://evil.example" would otherwise send them somewhere else.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const demo =
    process.env.NODE_ENV === "production"
      ? undefined
      : Object.entries(SEED_ACCOUNTS).map(([role, account]) => ({ role, email: account.email, password: account.password }));
  return <AuthForm next={safeNext} demoAccounts={demo} />;
}
