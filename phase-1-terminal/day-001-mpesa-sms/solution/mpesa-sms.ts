export function buildConfirmation(code: string, amount: number, name: string): string {
  const status = "Confirmed.";
  const currency = "Ksh";

  let message = `${code} ${status}`;
  message = `${message} ${currency}${amount}.00 sent to ${name}.`;

  return message;
}
