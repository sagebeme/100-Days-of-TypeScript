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

// TODO: the checkout form, with React Hook Form and the shared schema.
// 1. useForm<CheckoutInput, unknown, CheckoutValues>({ resolver: zodResolver(CheckoutSchema), mode: "onSubmit",
//    reValidateMode: "onChange", defaultValues: { name: "", email: "", phone: "" } }).
//    (Why not check each box as it loses focus? The error it adds pushes the Pay button down mid-click.)
// 2. Register all four fields at the top, in page order: const fields = { name: register("name"), ... }.
//    On a failed submit, the cursor goes to the first bad field in the order they were registered.
// 3. The form: <form className="checkout-form" noValidate aria-labelledby="checkout-heading" onSubmit={handleSubmit(onSubmit)}>
//    <h2 id="checkout-heading">Your details</h2>, then errors.root?.server as <div className="form-alert" role="alert">,
//    then three Fields:
//      "Full name"            hint "As it should appear on the tickets."                         autoComplete="name"
//      "Email"                hint "We'll send the tickets here too."                             type="email" autoComplete="email"
//      "M-Pesa phone number"  hint "You'll get a prompt on this phone to enter your PIN."        type="tel" autoComplete="tel"
//    each as {(control) => <input {...control} {...fields.name} ... />}, then the checkbox:
//      <div className="field checkbox-field"><label><input type="checkbox" {...fields.agree} aria-invalid aria-describedby="agree-error" />
//      <span>I agree to the <a href="#/terms">terms</a>. Tickets can't be refunded unless the event is cancelled.</span></label>
//      and its error as <p className="field-error" id="agree-error"></div>
//    and <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
//      "Sending the M-Pesa prompt…" while submitting, otherwise `Pay ${totalLabel} with M-Pesa`
// 4. onSubmit(values): const result = await submit({ ...values, lines }).
//    ok: onPlaced(result.order). "invalid": setError on each field the server named (anything else goes
//    to "root.server"), and setFocus the first. Otherwise: setError("root.server", { message }).
export function CheckoutForm({ lines, totalLabel, submit, onPlaced }: CheckoutFormProps) {
  void [useForm, zodResolver, CheckoutSchema, Field, lines, submit, onPlaced];
  void (null as unknown as CheckoutInput | CheckoutValues);
  return <p>TODO: the checkout form ({totalLabel})</p>;
}
