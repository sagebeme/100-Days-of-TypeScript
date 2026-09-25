// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizePhone, isTicket, parseSignup, type Signup } from "./starter/signup.ts";
import { mountSignup } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const valid = {
  name: "Amina",
  email: "amina@example.com",
  phone: "0712 345 678",
  ticket: "vip",
  guests: "2",
};

describe("normalizePhone", () => {
  it.each([
    ["0712345678", "+254712345678"],
    ["0712 345 678", "+254712345678"],
    ["0712-345-678", "+254712345678"],
    ["0110123456", "+254110123456"],
    ["254712345678", "+254712345678"],
    ["+254 712 345 678", "+254712345678"],
    ["+254110123456", "+254110123456"],
  ])("turns %s into %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(["", "12345", "0812345678", "071234567", "07123456789", "+255712345678", "07123456ab"])(
    "rejects %j",
    (raw) => {
      expect(normalizePhone(raw)).toBeNull();
    },
  );
});

describe("isTicket", () => {
  it("accepts the three ticket types", () => {
    expect(["regular", "vip", "student"].every(isTicket)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTicket("VIP")).toBe(false);
    expect(isTicket("backstage")).toBe(false);
    expect(isTicket("")).toBe(false);
  });
});

describe("parseSignup", () => {
  it("returns a clean sign-up for valid data", () => {
    expect(parseSignup(formData(valid))).toEqual({
      ok: true,
      value: { name: "Amina", email: "amina@example.com", phone: "+254712345678", ticket: "vip", guests: 2 },
    });
  });

  it("trims spaces around the text", () => {
    const result = parseSignup(formData({ ...valid, name: "  Amina  ", email: " amina@example.com " }));
    expect(result.ok && result.value.name).toBe("Amina");
    expect(result.ok && result.value.email).toBe("amina@example.com");
  });

  it("treats blank guests as 0", () => {
    const result = parseSignup(formData({ ...valid, guests: "" }));
    expect(result.ok && result.value.guests).toBe(0);
  });

  it("collects every error, not just the first", () => {
    const result = parseSignup(formData({ name: "A", email: "amina@", phone: "12", guests: "7" }));
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Enter your name",
        email: "Enter a valid email",
        phone: "Enter a Kenyan number like 0712 345 678",
        ticket: "Pick a ticket type",
        guests: "Guests must be 0 to 3",
      },
    });
  });

  it.each(["-1", "1.5", "four"])("rejects %s guests", (guests) => {
    const result = parseSignup(formData({ ...valid, guests }));
    expect(result).toEqual({ ok: false, errors: { guests: "Guests must be 0 to 3" } });
  });

  it("rejects an email with a space in it", () => {
    const result = parseSignup(formData({ ...valid, email: "amina @example.com" }));
    expect(result).toEqual({ ok: false, errors: { email: "Enter a valid email" } });
  });

  it("treats an uploaded file as a missing field", () => {
    const data = formData({ ...valid });
    data.set("name", new File(["x"], "name.txt"));
    expect(parseSignup(data)).toEqual({ ok: false, errors: { name: "Enter your name" } });
  });
});

describe("mountSignup", () => {
  let signups: Signup[];

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    signups = [];
    mountSignup(document, (signup) => signups.push(signup));
  });

  const field = (name: string) => document.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const errorFor = (name: string) => document.querySelector(`[data-error-for="${name}"]`)?.textContent;
  const status = () => document.querySelector("#status")?.textContent;

  function fill(values: Partial<typeof valid>): void {
    for (const [name, value] of Object.entries(values)) {
      if (name === "ticket") {
        document.querySelector<HTMLInputElement>(`[name="ticket"][value="${value}"]`)!.checked = true;
      } else {
        field(name).value = value;
      }
    }
  }

  function submit(): Event {
    const event = new Event("submit", { cancelable: true });
    document.querySelector("#signup")!.dispatchEvent(event);
    return event;
  }

  it("stops the page from reloading", () => {
    expect(submit().defaultPrevented).toBe(true);
  });

  it("shows each error next to its field and marks the field invalid", () => {
    fill({ name: "Amina", email: "nope", phone: "0712345678", guests: "9" });
    submit();
    expect(errorFor("email")).toBe("Enter a valid email");
    expect(errorFor("ticket")).toBe("Pick a ticket type");
    expect(errorFor("guests")).toBe("Guests must be 0 to 3");
    expect(errorFor("name")).toBe("");
    expect(field("email").getAttribute("aria-invalid")).toBe("true");
    expect(field("name").hasAttribute("aria-invalid")).toBe(false);
    expect(signups).toEqual([]);
  });

  it("focuses the first field with an error", () => {
    fill({ name: "Amina", email: "nope", phone: "12" });
    submit();
    expect(document.activeElement).toBe(field("email"));
  });

  it("clears old errors once they're fixed", () => {
    fill({ ...valid, email: "nope" });
    submit();
    fill({ email: "amina@example.com" });
    submit();
    expect(errorFor("email")).toBe("");
    expect(field("email").hasAttribute("aria-invalid")).toBe(false);
  });

  it("hands over the sign-up, confirms it and resets the form", () => {
    fill(valid);
    submit();
    expect(signups).toEqual([
      { name: "Amina", email: "amina@example.com", phone: "+254712345678", ticket: "vip", guests: 2 },
    ]);
    expect(status()).toBe("You're in, Amina! VIP ticket, 2 guests.");
    expect(field("name").value).toBe("");
  });

  it.each([
    ["0", "no guests"],
    ["1", "1 guest"],
  ])("says %s guests as %j", (guests, words) => {
    fill({ ...valid, ticket: "student", guests });
    submit();
    expect(status()).toBe(`You're in, Amina! Student ticket, ${words}.`);
  });

  it("does not call onSignup when there are errors", () => {
    const onSignup = vi.fn();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    mountSignup(document, onSignup);
    submit();
    expect(onSignup).not.toHaveBeenCalled();
  });
});
