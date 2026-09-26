import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema, type CheckoutInput, type CheckoutValues, type OrderRequest } from "./schemas.ts";
import { Field } from "./Field.tsx";
import type { OrderResult, PlacedOrder } from "./api.ts";

interface CheckoutFormProps {
  lines: OrderRequest["lines"];
  totalLabel: string; // "KES 20,000", for the button
  submit: (request: OrderRequest) => Promise<OrderResult>;
  onPlaced: (order: PlacedOrder) => void;
}

// React Hook Form keeps the fields' values and errors; the Zod schema decides what's valid.
// Checked when the form is sent (mode "onSubmit"), then again on every change (reValidateMode
// "onChange"), so an error disappears the moment it's fixed. Checking as each box loses focus
// sounds friendlier, but the error it adds pushes the Pay button down mid-click, and the click misses.
export function CheckoutForm({ lines, totalLabel, submit, onPlaced }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", phone: "" },
  });

  // Registered here, in the order they appear on the page. On a failed submit the cursor goes to the
  // first field with a problem, in the order fields were registered. Registering inside the Field
  // render props would register the checkbox (written directly below) before the boxes.
  const fields = { name: register("name"), email: register("email"), phone: register("phone"), agree: register("agree") };

  const onSubmit = async (values: CheckoutValues) => {
    const result = await submit({ ...values, lines });
    if (result.ok) return onPlaced(result.order);

    if (result.kind === "invalid") {
      // The server disagreed (it checks too). Show its messages on the fields they belong to.
      const problems = Object.entries(result.fields);
      for (const [field, message] of problems) {
        const name = field in CheckoutSchema.shape ? (field as keyof CheckoutInput) : "root.server";
        setError(name, { type: "server", message });
      }
      const first = problems.find(([field]) => field in CheckoutSchema.shape);
      if (first) setFocus(first[0] as keyof CheckoutInput);
      return;
    }
    setError("root.server", { type: result.kind, message: result.message });
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="checkout-heading">
      <h2 id="checkout-heading">Your details</h2>

      {errors.root?.server && (
        <div className="form-alert" role="alert">
          {errors.root.server.message}
        </div>
      )}

      <Field label="Full name" hint="As it should appear on the tickets." error={errors.name?.message}>
        {(control) => <input {...control} {...fields.name} autoComplete="name" />}
      </Field>

      <Field label="Email" hint="We'll send the tickets here too." error={errors.email?.message}>
        {(control) => <input {...control} {...fields.email} type="email" autoComplete="email" inputMode="email" spellCheck={false} />}
      </Field>

      <Field label="M-Pesa phone number" hint="You'll get a prompt on this phone to enter your PIN." error={errors.phone?.message}>
        {(control) => <input {...control} {...fields.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="0712 345 678" />}
      </Field>

      <div className="field checkbox-field" data-invalid={errors.agree ? "" : undefined}>
        <label>
          <input
            type="checkbox"
            {...fields.agree}
            aria-invalid={Boolean(errors.agree)}
            aria-describedby={errors.agree ? "agree-error" : undefined}
          />
          <span>
            I agree to the <a href="#/terms">terms</a>. Tickets can't be refunded unless the event is cancelled.
          </span>
        </label>
        {errors.agree && (
          <p className="field-error" id="agree-error">
            {errors.agree.message}
          </p>
        )}
      </div>

      <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
        {isSubmitting ? "Sending the M-Pesa prompt…" : `Pay ${totalLabel} with M-Pesa`}
      </button>
    </form>
  );
}
