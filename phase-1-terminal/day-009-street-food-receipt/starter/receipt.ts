export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export function formatReceiptLine(item: OrderItem): string {
  // TODO: pad item.name to 20 characters with .padEnd(20)
  // TODO: calculate the line total: item.price * item.quantity
  // TODO: return `${paddedName}KES ${lineTotal}`
  throw new Error("not implemented yet");
}
