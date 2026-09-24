import { describe, it, expect } from "vitest";
import { craftReply } from "./starter/fix-the-bot.ts";

describe("craftReply", () => {
  it("repeats the message and stays happy for small counts", () => {
    expect(craftReply("hi", 2)).toEqual({ message: "hihi", mood: "happy" });
  });

  it("gets annoyed when asked to repeat more than 3 times", () => {
    expect(craftReply("go", 5)).toEqual({ message: "gogogogogo", mood: "annoyed" });
  });

  it("stays happy at exactly 3 repeats", () => {
    expect(craftReply("ok", 3)).toEqual({ message: "okokok", mood: "happy" });
  });

  it("returns an empty message for zero repeats", () => {
    expect(craftReply("hey", 0)).toEqual({ message: "", mood: "happy" });
  });
});
