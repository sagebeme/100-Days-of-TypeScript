// Already written: the slash commands, as Discord wants them registered (register.ts sends them).
const STRING = 3;
const INTEGER = 4;

export const COMMANDS = [
  { name: "events", description: "What's on soon, with prices and seats left" },
  {
    name: "event",
    description: "One event: when, where, and a link to buy",
    options: [{ name: "event", description: "Start typing its name", type: INTEGER, required: true, autocomplete: true }],
  },
  {
    name: "checkin",
    description: "Gate staff: let a ticket in",
    options: [
      { name: "event", description: "Which event", type: INTEGER, required: true, autocomplete: true },
      { name: "code", description: "The code under the QR, like T42-9F3AC1D277B0E4A1", type: STRING, required: true, min_length: 5, max_length: 40 },
    ],
  },
];
