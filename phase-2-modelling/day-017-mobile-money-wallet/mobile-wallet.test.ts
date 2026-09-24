import { describe, it, expect } from "vitest";
import { MobileWallet } from "./starter/mobile-wallet.ts";

describe("MobileWallet", () => {
  it("remembers its owner and starts at 0 by default", () => {
    const wallet = new MobileWallet("Amina");
    expect(wallet.owner).toBe("Amina");
    expect(wallet.balance).toBe(0);
  });

  it("starts with an opening balance when given one", () => {
    expect(new MobileWallet("Kip", 500).balance).toBe(500);
  });

  it("adds deposits to the balance", () => {
    const wallet = new MobileWallet("Amina", 100);
    wallet.deposit(50.5);
    expect(wallet.balance).toBe(150.5);
  });

  it("does not suffer from floating point drift", () => {
    const wallet = new MobileWallet("Amina");
    wallet.deposit(0.1);
    wallet.deposit(0.2);
    expect(wallet.balance).toBe(0.3);
  });

  it("rejects deposits that are not positive", () => {
    const wallet = new MobileWallet("Amina", 100);
    expect(() => wallet.deposit(0)).toThrow("Amount must be positive");
    expect(() => wallet.deposit(-5)).toThrow("Amount must be positive");
    expect(wallet.balance).toBe(100);
  });

  it("moves money from one wallet to another", () => {
    const amina = new MobileWallet("Amina", 500);
    const kip = new MobileWallet("Kip");
    amina.send(200, kip);
    expect(amina.balance).toBe(300);
    expect(kip.balance).toBe(200);
  });

  it("refuses to send more than the balance and leaves both wallets unchanged", () => {
    const amina = new MobileWallet("Amina", 100);
    const kip = new MobileWallet("Kip", 10);
    expect(() => amina.send(150, kip)).toThrow("Insufficient funds");
    expect(amina.balance).toBe(100);
    expect(kip.balance).toBe(10);
  });

  it("rejects sends that are not positive", () => {
    const amina = new MobileWallet("Amina", 100);
    const kip = new MobileWallet("Kip");
    expect(() => amina.send(0, kip)).toThrow("Amount must be positive");
    expect(() => amina.send(-20, kip)).toThrow("Amount must be positive");
  });

  it("keeps the balance private: only the owner shows up as an own property", () => {
    const wallet = new MobileWallet("Amina", 500);
    expect(Object.keys(wallet)).toEqual(["owner"]);
    expect(JSON.stringify(wallet)).toBe('{"owner":"Amina"}');
  });
});
