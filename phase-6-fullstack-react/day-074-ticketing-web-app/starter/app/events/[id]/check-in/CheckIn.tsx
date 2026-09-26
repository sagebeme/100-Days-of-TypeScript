"use client";

import { useRef, useState, type FormEvent } from "react";

// TODO: the gate, on the organiser's phone. A scanner app (or a person typing) puts a code in the box
// and presses Enter; the answer fills the screen, green or red; the box empties, ready for the next.
// - <p className="gate-count" aria-live="polite"><strong>{inside}</strong> of {sold} in</p>, where inside is
//   alreadyIn plus everyone let in on this screen.
// - <form className="scan-form"> with <label htmlFor="ticket-code">Ticket code</label> and, in a
//   <div className="scan-row">, <input id="ticket-code" autoFocus autoComplete="off" spellCheck={false}
//   placeholder="Scan or type a code" /> (a ref: you'll clear and focus it) and a "Check" submit button.
// - On submit (ignore an empty box): POST /api/events/{eventId}/check-in with { code }.
//     ok:  "Let them in: {holder}"
//     not: "Don't let them in. {the body's error}"
//     fetch throws: "Don't let them in. No connection. Check the ticket again in a moment."
//   Show the latest as <div className="verdict" data-admitted={admitted || undefined} role="alert">
//   <span className="verdict-mark" aria-hidden="true">✓ or ✕</span><p>the message</p></div>,
//   then empty the box and focus it again.
// - Earlier scans (up to 20), newest first: <h2 id="recent-scans">Earlier</h2> and
//   <ol className="scan-log"> with <li data-admitted><code>{code}</code> {message}</li>.
export function CheckIn({ eventId, sold, alreadyIn }: { eventId: number; sold: number; alreadyIn: number }) {
  void [useRef, useState, eventId];
  void (null as unknown as FormEvent);
  return (
    <p>
      TODO: check-in ({alreadyIn} of {sold} in)
    </p>
  );
}
