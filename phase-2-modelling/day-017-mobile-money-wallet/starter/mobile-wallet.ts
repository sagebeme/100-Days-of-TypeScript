export class MobileWallet {
  readonly owner: string;
  #balanceCents = 0;

  constructor(owner: string, openingBalance = 0) {
    // TODO: this.owner = owner
    // TODO: this.#balanceCents = Math.round(openingBalance * 100)
    throw new Error("not implemented yet");
  }

  get balance(): number {
    // TODO: return the balance in shillings (cents divided by 100)
    throw new Error("not implemented yet");
  }

  deposit(amount: number): void {
    // TODO: throw new Error("Amount must be positive") if amount <= 0
    // TODO: add Math.round(amount * 100) to the private balance
    throw new Error("not implemented yet");
  }

  send(amount: number, recipient: MobileWallet): void {
    // TODO: throw new Error("Amount must be positive") if amount <= 0
    // TODO: throw new Error("Insufficient funds") if the amount (in cents) is more than the balance
    // TODO: subtract from this wallet, then recipient.deposit(amount)
    throw new Error("not implemented yet");
  }
}
