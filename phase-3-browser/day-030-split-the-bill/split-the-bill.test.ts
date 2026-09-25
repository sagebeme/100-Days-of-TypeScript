// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitBill, formatKes } from "./starter/split.ts";
import { getElement } from "./starter/dom.ts";
import { mountSplitter } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");

// Puts the <body> of your index.html into the test browser's page.
function loadPage(): void {
  const page = new DOMParser().parseFromString(html, "text/html");
  document.body.innerHTML = page.body.innerHTML;
}

function type(selector: string, value: string): void {
  const field = document.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
  if (field === null) throw new Error(`test page has no ${selector}`);
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

const resultText = () => document.querySelector("#result")?.textContent;

describe("splitBill", () => {
  it("adds the tip and splits the grand total", () => {
    expect(splitBill(4800, 6, 10)).toEqual({ tip: 480, grandTotal: 5280, perPerson: 880 });
  });

  it("works with no tip", () => {
    expect(splitBill(3000, 3, 0)).toEqual({ tip: 0, grandTotal: 3000, perPerson: 1000 });
  });

  it("rounds each share up, so the bill is never short", () => {
    expect(splitBill(1000, 3, 0).perPerson).toBe(334);
  });

  it("rounds the tip to the nearest shilling", () => {
    expect(splitBill(1234, 1, 5).tip).toBe(62);
  });

  it.each([0, -50, NaN, Infinity])("rejects a total of %s", (total) => {
    expect(() => splitBill(total, 2, 10)).toThrow("Enter a total above 0");
  });

  it.each([0, 2.5, -1, NaN])("rejects %s people", (people) => {
    expect(() => splitBill(1000, people, 10)).toThrow("Enter how many people are paying");
  });

  it("rejects a negative tip", () => {
    expect(() => splitBill(1000, 2, -5)).toThrow("Tip can't be negative");
  });
});

describe("formatKes", () => {
  it.each([
    [880, "KES 880"],
    [4800, "KES 4,800"],
    [1250000, "KES 1,250,000"],
  ])("formats %i as %s", (amount, expected) => {
    expect(formatKes(amount)).toBe(expected);
  });
});

describe("getElement", () => {
  beforeEach(() => {
    document.body.innerHTML = `<input id="name"><p id="note">hi</p>`;
  });

  it("returns the element, typed", () => {
    const input = getElement(document, "#name", HTMLInputElement);
    input.value = "Otieno";
    expect(input.value).toBe("Otieno");
  });

  it("throws when nothing matches", () => {
    expect(() => getElement(document, "#missing", HTMLInputElement)).toThrow("Missing element: #missing");
  });

  it("throws when the element is the wrong kind", () => {
    expect(() => getElement(document, "#note", HTMLInputElement)).toThrow("#note is not a HTMLInputElement");
  });
});

describe("mountSplitter", () => {
  beforeEach(loadPage);

  it("asks for input before anything is typed", () => {
    mountSplitter(document);
    expect(resultText()).toBe("Enter the total and how many people");
  });

  it("shows each person's share as you type", () => {
    mountSplitter(document);
    type("#total", "4800");
    type("#people", "6");
    type("#tip", "10");
    expect(resultText()).toBe("Each person pays KES 880 (tip KES 480)");
  });

  it("updates when the tip changes", () => {
    mountSplitter(document);
    type("#total", "3000");
    type("#people", "3");
    type("#tip", "0");
    expect(resultText()).toBe("Each person pays KES 1,000 (tip KES 0)");
  });

  it("shows the error message for bad input", () => {
    mountSplitter(document);
    type("#total", "4800");
    type("#people", "0");
    expect(resultText()).toBe("Enter how many people are paying");
  });

  it("stops the form from reloading the page on Enter", () => {
    mountSplitter(document);
    const submit = new Event("submit", { cancelable: true });
    document.querySelector("#bill")?.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });

  it("fails loudly when the page is missing an element", () => {
    document.body.innerHTML = `<form id="bill"></form>`;
    expect(() => mountSplitter(document)).toThrow("Missing element: #total");
  });
});
