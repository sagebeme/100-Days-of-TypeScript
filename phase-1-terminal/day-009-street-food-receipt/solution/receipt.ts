export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export function formatReceiptLine(item: OrderItem): string {
  const paddedName = item.name.padEnd(20);
  const lineTotal = item.price * item.quantity;
  return `${paddedName}KES ${lineTotal}`;
}
