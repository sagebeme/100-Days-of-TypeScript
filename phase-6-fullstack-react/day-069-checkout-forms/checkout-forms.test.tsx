// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CheckoutSchema, OrderRequestSchema, SafaricomPhone, fieldErrors } from "./starter/schemas.ts";
import { createOrder, type OrderResult } from "./starter/api.ts";
import { Field } from "./starter/Field.tsx";
import { CheckoutForm } from "./starter/CheckoutForm.tsx";

afterEach(cleanup);

const good = { name: "Amina Wanjiru", email: "amina@example.com", phone: "0712 345 678", agree: true as const };
const lines = [{ tierId: "vip", quantity: 2 }];

describe("the shared schema", () => {
  it("accepts every way Kenyans write a Safaricom number, and stores one form", () => {
    for (const phone of ["0712345678", "0712 345 678", "+254 712 345 678", "254712345678", "0712-345-678"]) {
      expect(SafaricomPhone.parse(phone)).toBe("254712345678");
    }
    expect(SafaricomPhone.parse("0110 123 456")).toBe("254110123456");
  });

  it("rejects numbers that can't get an M-Pesa prompt", () => {
    for (const phone of ["", "0812345678", "071234567", "07123456789", "+1 212 555 0100", "zero seven"]) {
      const result = SafaricomPhone.safeParse(phone);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Enter a Safaricom number like 0712 345 678");
    }
  });

  it("tidies what it's given: trimmed names, lowercase emails", () => {
    expect(CheckoutSchema.parse({ ...good, name: "  Amina Wanjiru ", email: " Amina@Example.COM " })).toEqual({
      name: "Amina Wanjiru",
      email: "amina@example.com",
      phone: "254712345678",
      agree: true,
    });
  });

  it("explains each problem in words a person can act on", () => {
    const result = CheckoutSchema.safeParse({ name: "A", email: "amina@", phone: "", agree: false });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({
      name: "Enter your name, as it should appear on the tickets",
      email: "Enter an email like amina@example.com",
      phone: "Enter a Safaricom number like 0712 345 678",
      agree: "Tick the box to agree to the terms",
    });
  });

  it("is extended, not copied, for what the API receives", () => {
    expect(OrderRequestSchema.parse({ ...good, lines }).phone).toBe("254712345678");
    expect(OrderRequestSchema.safeParse({ ...good, lines: [] }).success).toBe(false);
    expect(OrderRequestSchema.safeParse({ ...good, phone: "123", lines }).success).toBe(false); // the same phone rule
    expect(Object.keys(OrderRequestSchema.shape)).toEqual([...Object.keys(CheckoutSchema.shape), "lines"]);
  });
});

describe("createOrder", () => {
  const request = OrderRequestSchema.parse({ ...good, lines });
  const answer = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it("posts the order as JSON", async () => {
    const fetchFn = answer(201, { order: { id: 7, totalKes: 12000, phone: "254712345678" } });
    expect(await createOrder(request, fetchFn)).toEqual({ ok: true, order: { id: 7, totalKes: 12000, phone: "254712345678" } });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/orders");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("turns every other answer into a result the form can handle", async () => {
    expect(await createOrder(request, answer(422, { errors: { phone: "Not that one" } }))).toEqual({ ok: false, kind: "invalid", fields: { phone: "Not that one" } });
    expect(await createOrder(request, answer(409, { error: "Only 1 left" }))).toEqual({ ok: false, kind: "sold-out", message: "Only 1 left" });
    expect(await createOrder(request, answer(502, { error: "M-Pesa didn't answer" }))).toEqual({ ok: false, kind: "unavailable", message: "M-Pesa didn't answer" });
    const html = vi.fn(async () => new Response("<h1>Bad Gateway</h1>", { status: 500 }));
    expect(await createOrder(request, html)).toMatchObject({ ok: false, kind: "unavailable", message: expect.stringMatching(/No money was taken/) });
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await createOrder(request, offline)).toMatchObject({ ok: false, kind: "unavailable", message: expect.stringMatching(/offline/) });
  });
});

describe("Field", () => {
  it("ties the label, hint and error to the input", () => {
    render(
      <Field label="Email" hint="We'll send the tickets here." error="Enter an email">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const described = input.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(["We'll send the tickets here.", "Enter an email"]);
  });

  it("says nothing extra when there's nothing to say", () => {
    render(<Field label="Name">{(control) => <input {...control} />}</Field>);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("CheckoutForm", () => {
  function setup(result: OrderResult | (() => Promise<OrderResult>) = { ok: true, order: { id: 1, totalKes: 12000, phone: "254712345678" } }) {
    const submit = vi.fn(typeof result === "function" ? result : async () => result);
    const onPlaced = vi.fn();
    render(<CheckoutForm lines={lines} totalLabel="KES 12,000" submit={submit} onPlaced={onPlaced} />);
    const box = (name: string) => screen.getByRole("textbox", { name });
    const fill = async (values: Partial<typeof good> = good) => {
      if (values.name) await userEvent.type(box("Full name"), values.name);
      if (values.email) await userEvent.type(box("Email"), values.email);
      if (values.phone) await userEvent.type(box("M-Pesa phone number"), values.phone);
      if (values.agree) await userEvent.click(screen.getByRole("checkbox"));
    };
    const pay = () => userEvent.click(screen.getByRole("button", { name: /with M-Pesa/ }));
    return { submit, onPlaced, box, fill, pay };
  }

  it("sends the checked values and the cart, then hands over the order", async () => {
    const { submit, onPlaced, fill, pay } = setup();
    await fill({ ...good, email: "Amina@Example.com" });
    await pay();
    expect(submit).toHaveBeenCalledWith({ name: "Amina Wanjiru", email: "amina@example.com", phone: "254712345678", agree: true, lines });
    expect(onPlaced).toHaveBeenCalledWith({ id: 1, totalKes: 12000, phone: "254712345678" });
  });

  it("shows every problem on its field, and puts the cursor in the first one", async () => {
    const { submit, box, pay } = setup();
    await userEvent.type(box("Email"), "amina@");
    await pay();
    expect(submit).not.toHaveBeenCalled();
    expect(box("Full name").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(box("Full name"));
    for (const message of ["Enter your name", "Enter an email like", "Enter a Safaricom number", "Tick the box"]) {
      expect(screen.getByText(new RegExp(message))).toBeTruthy();
    }
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
  });

  it("clears an error as soon as it's fixed", async () => {
    const { box, pay } = setup();
    await pay();
    expect(screen.queryByText(/Enter your name/)).toBeTruthy();
    await userEvent.type(box("Full name"), "Amina");
    expect(screen.queryByText(/Enter your name/)).toBeNull();
    expect(box("Full name").getAttribute("aria-invalid")).toBe("false");
  });

  it("doesn't nag before the first try", async () => {
    const { box } = setup();
    await userEvent.type(box("Full name"), "A");
    await userEvent.tab();
    expect(screen.queryByText(/Enter your name/)).toBeNull();
  });

  it("shows what the server said about a field on that field", async () => {
    const { fill, pay, box } = setup({ ok: false, kind: "invalid", fields: { phone: "That number isn't registered for M-Pesa" } });
    await fill();
    await pay();
    expect(screen.getByText("That number isn't registered for M-Pesa")).toBeTruthy();
    expect(box("M-Pesa phone number").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(box("M-Pesa phone number"));
  });

  it("shows problems that aren't about a field as an alert above the form", async () => {
    const { fill, pay, onPlaced } = setup({ ok: false, kind: "sold-out", message: "Only 1 VIP left. Change your order." });
    await fill();
    await pay();
    expect(screen.getByRole("alert").textContent).toBe("Only 1 VIP left. Change your order.");
    expect(onPlaced).not.toHaveBeenCalled();
  });

  it("can't be sent twice while the first one is on its way", async () => {
    let finish!: (result: OrderResult) => void;
    const { fill, pay, submit } = setup(() => new Promise<OrderResult>((resolve) => (finish = resolve)));
    await fill();
    await pay();
    const button = screen.getByRole("button", { name: /Sending the M-Pesa prompt/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(submit).toHaveBeenCalledOnce();
    finish({ ok: false, kind: "unavailable", message: "Try again" });
    await waitFor(() => expect((screen.getByRole("button", { name: "Pay KES 12,000 with M-Pesa" }) as HTMLButtonElement).disabled).toBe(false));
  });

  it("uses the right keyboard and autofill for each box", () => {
    const { box } = setup();
    expect(box("Full name").getAttribute("autocomplete")).toBe("name");
    expect(box("Email").getAttribute("type")).toBe("email");
    expect(box("M-Pesa phone number").getAttribute("type")).toBe("tel");
    expect(box("M-Pesa phone number").getAttribute("autocomplete")).toBe("tel");
  });
});
