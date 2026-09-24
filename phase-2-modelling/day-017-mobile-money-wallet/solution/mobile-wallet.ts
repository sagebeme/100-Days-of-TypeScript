export class MobileWallet {
  readonly owner: string;
  #balanceCents = 0;

  constructor(owner: string, openingBalance = 0) {
    this.owner = owner;
    this.#balanceCents = Math.round(openingBalance * 100);
  }

  get balance(): number {
    return this.#balanceCents / 100;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
    this.#balanceCents += Math.round(amount * 100);
  }

  send(amount: number, recipient: MobileWallet): void {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
    const cents = Math.round(amount * 100);
    if (cents > this.#balanceCents) {
      throw new Error("Insufficient funds");
    }
    this.#balanceCents -= cents;
    recipient.deposit(amount);
  }
}
