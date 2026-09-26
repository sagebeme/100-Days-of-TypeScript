"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Already written: log in or sign up, against the API's /api/login and /api/signup (Day 61). The
// session cookie comes back with the answer; then the page re-renders on the server as you.
export function AuthForm({ next, demoAccounts }: { next: string; demoAccounts?: { email: string; password: string; role: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null);
    setBusy(false);
    if (!response) return setError("You seem to be offline. Try again.");
    if (!response.ok) return setError(((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong");
    router.push(next);
    router.refresh();
  };

  return (
    <div className="auth">
      <div className="tabs" role="tablist" aria-label="Log in or sign up">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => (setMode(m), setError(null))}>
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <form className="checkout-form" onSubmit={submit}>
        <h1>{mode === "login" ? "Welcome back" : "Make an account"}</h1>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" autoComplete="name" required />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          {mode === "signup" && (
            <p className="field-hint" id="password-hint">
              At least 10 characters. A few random words work well.
            </p>
          )}
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-describedby={mode === "signup" ? "password-hint" : undefined}
            required
          />
        </div>
        <button type="submit" className="button button-primary button-block" disabled={busy}>
          {busy ? "One moment…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      {demoAccounts && (
        <aside className="demo-accounts" aria-label="Demo accounts">
          <p>
            <strong>Demo accounts</strong> (development only)
          </p>
          <ul>
            {demoAccounts.map((account) => (
              <li key={account.email}>
                {account.role}: <code>{account.email}</code> / <code>{account.password}</code>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
