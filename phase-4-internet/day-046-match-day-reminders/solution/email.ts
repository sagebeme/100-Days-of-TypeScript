import { formatKickoff, type Reminder } from "./schedule.ts";

export interface Email {
  to: string;
  subject: string;
  text: string; // for mail apps that don't show HTML, and for screen readers
  html: string;
}

// Anything that can send an email: the real service, the console, or a test fake.
export interface EmailSender {
  send(email: Email): Promise<void>;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// Text from outside (team names) must never become HTML.
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function reminderEmail(reminder: Reminder, to: string): Email {
  const { home, away, competition, kickoff } = reminder.fixture;
  const match = `${home} vs ${away}`;
  const when = formatKickoff(kickoff);
  const subject = reminder.kind === "eve" ? `Tomorrow: ${match}` : `Kick-off in 2 hours: ${match}`;
  const lead = reminder.kind === "eve" ? "Match day is tomorrow." : "Two hours to kick-off. Get the snacks in.";

  const text = [lead, "", match, competition, when].join("\n");

  // Email apps ignore <style> tags and most modern CSS, so the styles are inline and simple.
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2328">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e6ea">
      <div style="background:#0f7a4f;color:#ffffff;padding:16px 24px;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${escapeHtml(competition)}</div>
      <div style="padding:24px">
        <p style="margin:0 0 16px;font-size:16px">${escapeHtml(lead)}</p>
        <p style="margin:0;font-size:24px;font-weight:bold;line-height:1.3">${escapeHtml(home)} <span style="color:#6b7280;font-weight:normal">vs</span> ${escapeHtml(away)}</p>
        <p style="margin:12px 0 0;font-size:16px;color:#374151">${escapeHtml(when)}</p>
      </div>
    </div>
  </body>
</html>`;

  return { to, subject, text, html };
}

// Sends through Resend (resend.com). Any email API works the same way: a POST with a key.
export function resendSender(apiKey: string, from: string, fetchFn: Fetcher): EmailSender {
  return {
    async send(email) {
      const response = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
      });
      if (!response.ok) {
        throw new Error(`Email failed (${response.status}): ${await response.text()}`);
      }
    },
  };
}

// For trying it out without an email account: prints instead of sending.
export function consoleSender(log: (line: string) => void = console.log): EmailSender {
  return {
    async send(email) {
      log(`To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    },
  };
}
