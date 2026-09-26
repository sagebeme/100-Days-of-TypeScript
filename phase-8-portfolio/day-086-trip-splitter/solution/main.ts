import { balances, formatKes, owed, settleUp, summary, type Expense, type Split } from "./split.ts";

// The page. The money rules are in split.ts; this draws them and remembers the trip on the device.
interface Trip {
  name: string;
  people: string[];
  expenses: Expense[];
}
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const KEY = "trip-splitter";

const SAMPLE: Trip = {
  name: "Diani weekend",
  people: ["Amina", "Baraka", "Chege", "Wanjiru"],
  expenses: [
    { id: "1", description: "Airbnb, 2 nights", paidBy: "Amina", amount: 24000, split: { kind: "equal", between: ["Amina", "Baraka", "Chege", "Wanjiru"] } },
    { id: "2", description: "Fuel there and back", paidBy: "Baraka", amount: 6500, split: { kind: "equal", between: ["Amina", "Baraka", "Chege", "Wanjiru"] } },
    { id: "3", description: "Seafood dinner", paidBy: "Chege", amount: 9200, split: { kind: "shares", shares: { Amina: 1, Baraka: 1, Chege: 2, Wanjiru: 1 } } },
    { id: "4", description: "Glass-bottom boat", paidBy: "Wanjiru", amount: 3000, split: { kind: "exact", amounts: { Amina: 1000, Baraka: 1000, Chege: 1000, Wanjiru: 0 } } },
  ],
};

function load(): Trip {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") ?? SAMPLE;
  } catch {
    return SAMPLE;
  }
}
let trip = load();
function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
  } catch {
    /* the trip lasts until the page closes */
  }
}

const mode = () => (document.querySelector('input[name="mode"]:checked') as HTMLInputElement).value as Split["kind"];

function renderSplitInputs(): void {
  const m = mode();
  $("split-people").replaceChildren(
    ...trip.people.map((person) => {
      const row = document.createElement("label");
      row.className = "split-person";
      const name = Object.assign(document.createElement("span"), { textContent: person });
      const input = document.createElement("input");
      input.dataset.person = person;
      if (m === "equal") Object.assign(input, { type: "checkbox", checked: true });
      else Object.assign(input, { type: "number", min: "0", step: "1", value: m === "shares" ? "1" : "", placeholder: "0" });
      input.setAttribute("aria-label", `${person}'s ${m === "equal" ? "part" : m === "shares" ? "shares" : "amount in KES"}`);
      row.append(name, input);
      return row;
    }),
  );
}

function renderPeople(): void {
  $("people").replaceChildren(
    ...trip.people.map((person) => {
      const chip = Object.assign(document.createElement("span"), { className: "chip", textContent: person });
      const inUse = trip.expenses.some((e) => e.paidBy === person || person in owed(e));
      const remove = Object.assign(document.createElement("button"), { type: "button", textContent: "✕", title: inUse ? `${person} is in an expense` : `Remove ${person}` });
      remove.setAttribute("aria-label", `Remove ${person}`);
      remove.disabled = inUse;
      remove.addEventListener("click", () => ((trip.people = trip.people.filter((p) => p !== person)), save(), render()));
      chip.append(remove);
      return chip;
    }),
  );
  $<HTMLSelectElement>("paid-by").replaceChildren(...trip.people.map((p) => new Option(p, p)));
}

function render(): void {
  renderPeople();
  renderSplitInputs();
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
  $("total").textContent = trip.expenses.length ? formatKes(total) : "";
  $("expenses").replaceChildren(
    ...(trip.expenses.length
      ? [...trip.expenses].reverse().map((e) => {
          const li = document.createElement("li");
          const splitText = e.split.kind === "equal" ? `split ${e.split.between.length} ways` : e.split.kind === "shares" ? "split by shares" : "exact amounts";
          li.innerHTML = `<span class="what"></span><span class="who"></span><span class="amount"></span><button type="button">✕</button>`;
          li.querySelector(".what")!.textContent = e.description;
          li.querySelector(".who")!.textContent = `${e.paidBy} paid · ${splitText}`;
          li.querySelector(".amount")!.textContent = formatKes(e.amount);
          const remove = li.querySelector("button")!;
          remove.setAttribute("aria-label", `Delete ${e.description}`);
          remove.addEventListener("click", () => ((trip.expenses = trip.expenses.filter((x) => x.id !== e.id)), save(), render()));
          return li;
        })
      : [Object.assign(document.createElement("li"), { className: "empty", textContent: "No expenses yet." })]),
  );

  const balance = balances(trip.people, trip.expenses);
  const biggest = Math.max(1, ...Object.values(balance).map(Math.abs));
  $("balances").replaceChildren(
    ...trip.people.map((person) => {
      const b = balance[person];
      const li = document.createElement("li");
      li.innerHTML = `<span class="name"></span><span class="bar" aria-hidden="true"><span class="fill"></span></span><span class="value"></span>`;
      li.querySelector(".name")!.textContent = person;
      const fill = li.querySelector<HTMLElement>(".fill")!;
      fill.classList.add(b >= 0 ? "plus" : "minus");
      fill.style.width = `${(Math.abs(b) / biggest) * 50}%`;
      const value = li.querySelector(".value")!;
      value.classList.add(b > 0 ? "plus" : b < 0 ? "minus" : "zero");
      value.textContent = b === 0 ? "square" : `${b > 0 ? "+" : "−"}${formatKes(Math.abs(b))}`;
      li.setAttribute("aria-label", b === 0 ? `${person} is square` : `${person} ${b > 0 ? "gets back" : "owes"} ${formatKes(Math.abs(b))}`);
      return li;
    }),
  );

  const transfers = settleUp(balance);
  $("transfers").replaceChildren(
    ...(transfers.length
      ? transfers.map((t) => {
          const li = document.createElement("li");
          li.innerHTML = `<span></span><span class="arrow" aria-label="sends">→</span><span></span><span class="amount"></span>`;
          const [from, , to, amount] = li.children;
          from.textContent = t.from;
          to.textContent = t.to;
          amount.textContent = formatKes(t.amount);
          return li;
        })
      : [Object.assign(document.createElement("li"), { className: "square", textContent: "Everyone's square 🎉" })]),
  );
  $<HTMLInputElement>("trip").value = trip.name;
}

$("expense").addEventListener("submit", (event) => {
  event.preventDefault();
  const error = $("expense-error");
  const amount = Number($<HTMLInputElement>("amount").value.replace(/[,\s]/g, ""));
  const inputs = [...$("split-people").querySelectorAll<HTMLInputElement>("input")];
  const m = mode();
  let split: Split;
  if (m === "equal") split = { kind: "equal", between: inputs.filter((i) => i.checked).map((i) => i.dataset.person!) };
  else {
    const values = Object.fromEntries(inputs.map((i) => [i.dataset.person!, Number(i.value || 0)]));
    split = m === "shares" ? { kind: "shares", shares: values } : { kind: "exact", amounts: values };
  }
  const expense: Expense = { id: crypto.randomUUID(), description: $<HTMLInputElement>("description").value.trim(), paidBy: $<HTMLSelectElement>("paid-by").value, amount, split };
  try {
    owed(expense); // checks it: whole shillings, somebody to split with, parts that add up
  } catch (e) {
    error.textContent = e instanceof Error ? e.message.replace(/^[^:]*: /, "") : "That expense doesn't add up";
    return;
  }
  error.textContent = "";
  trip.expenses = [...trip.expenses, expense];
  save();
  ($("expense") as HTMLFormElement).reset();
  render();
  $<HTMLInputElement>("description").focus();
});

$("mode").addEventListener("change", renderSplitInputs);
$("add-person").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $<HTMLInputElement>("person").value.trim();
  if (name && !trip.people.includes(name)) trip.people = [...trip.people, name];
  $<HTMLInputElement>("person").value = "";
  save();
  render();
});
$<HTMLInputElement>("trip").addEventListener("input", (e) => ((trip.name = (e.target as HTMLInputElement).value), save()));
$("copy").addEventListener("click", async () => {
  const text = summary(trip.name, trip.people, trip.expenses);
  try {
    await navigator.clipboard.writeText(text);
    $("copied").textContent = "Copied. Paste it in the group chat.";
  } catch {
    $("copied").textContent = "Couldn't copy here. Select and copy the list above.";
  }
});

render();
