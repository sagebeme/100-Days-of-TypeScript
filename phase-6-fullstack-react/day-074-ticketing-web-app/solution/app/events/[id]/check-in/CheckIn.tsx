"use client";

import { useRef, useState, type FormEvent } from "react";

interface Scan {
  at: number;
  code: string;
  admitted: boolean;
  message: string;
}

// The gate, on the organiser's phone. A scanner app (or a person typing) puts the code in the box
// and presses Enter; the answer fills the screen in green or red, big enough to read at arm's length
// in the dark; the box empties and is ready for the next person.
export function CheckIn({ eventId, sold, alreadyIn }: { eventId: number; sold: number; alreadyIn: number }) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inside = alreadyIn + scans.filter((s) => s.admitted).length;
  const latest = scans[0];

  const check = async (event: FormEvent) => {
    event.preventDefault();
    const code = input.current?.value.trim() ?? "";
    if (!code || busy) return;
    setBusy(true);
    let scan: Scan;
    try {
      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json().catch(() => ({}))) as { holder?: string; error?: string };
      scan = response.ok
        ? { at: Date.now(), code, admitted: true, message: `Let them in: ${body.holder ?? "ticket holder"}` }
        : { at: Date.now(), code, admitted: false, message: body.error ?? "Couldn't check that ticket" };
    } catch {
      scan = { at: Date.now(), code, admitted: false, message: "No connection. Check the ticket again in a moment." };
    }
    setScans((previous) => [scan, ...previous].slice(0, 20));
    setBusy(false);
    if (input.current) input.current.value = "";
    input.current?.focus();
  };

  return (
    <div className="check-in">
      <p className="gate-count" aria-live="polite">
        <strong>{inside}</strong> of {sold} in
      </p>
      <form className="scan-form" onSubmit={check}>
        <label htmlFor="ticket-code">Ticket code</label>
        <div className="scan-row">
          <input ref={input} id="ticket-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Scan or type a code" autoFocus />
          <button type="submit" className="button button-primary" disabled={busy}>
            Check
          </button>
        </div>
      </form>
      {latest && (
        <div className="verdict" data-admitted={latest.admitted || undefined} role="alert">
          <span className="verdict-mark" aria-hidden="true">
            {latest.admitted ? "✓" : "✕"}
          </span>
          <p>
            {latest.admitted ? "" : "Don't let them in. "}
            {latest.message}
          </p>
        </div>
      )}
      {scans.length > 1 && (
        <section aria-labelledby="recent-scans">
          <h2 id="recent-scans">Earlier</h2>
          <ol className="scan-log">
            {scans.slice(1).map((scan) => (
              <li key={scan.at + scan.code} data-admitted={scan.admitted || undefined}>
                <code>{scan.code}</code> {scan.message}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
