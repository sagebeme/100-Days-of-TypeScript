export type MenuItem = {
  name: string;
  price: number;
};

export const menu: MenuItem[] = [
  { name: "Chips Masala", price: 200 },
  { name: "Smokie Pasua", price: 80 },
  { name: "Mandazi", price: 20 },
  { name: "Soda", price: 60 },
];

export function findItem(name: string): MenuItem | undefined {
  // TODO: return the menu item whose name matches, or undefined if there isn't one
  throw new Error("not implemented yet");
}
