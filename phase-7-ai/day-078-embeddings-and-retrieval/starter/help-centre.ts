// Already written: Tikiti's help centre. The concierge answers from these pages, and says which ones.
export interface HelpPage {
  id: string;
  title: string;
  text: string; // paragraphs separated by blank lines
}

export const HELP_CENTRE: HelpPage[] = [
  {
    id: "paying",
    title: "Paying with M-Pesa",
    text: `When you order, we send an M-Pesa prompt to the phone number you give us. Enter your M-Pesa PIN on your phone to pay. You don't need a till number or a paybill: the prompt has everything in it.

Your seats are held for 10 minutes while you pay. If you don't enter your PIN in time, the seats go back on sale and no money is taken. You can order again straight away.

If the prompt doesn't arrive, check that the number is a Safaricom line with M-Pesa, that your phone has signal, and that your SIM toolkit isn't open in another app. Then order again: the first order will expire by itself.`,
  },
  {
    id: "refunds",
    title: "Refunds",
    text: `Tickets can't be refunded if you can't make it, but you can give your ticket to a friend: anyone with the code can use it once.

If an event is cancelled, everyone who bought tickets gets their money back automatically, to the M-Pesa number that paid. Refunds arrive within 3 working days. You don't need to do anything.

If an event moves to a new date, your ticket is valid on the new date. If you can't make the new date, you can ask for a refund within 7 days of the change.`,
  },
  {
    id: "tickets",
    title: "Finding your tickets",
    text: `Your tickets are under "My tickets" once you've logged in. Each one has a code like T12-9F3AC1D277B0E4A1, and a QR code with the same information.

We also email your tickets to you after you pay. Check your spam folder if they're not in your inbox.

You don't need to print anything. Showing the code on your phone is enough, even with a cracked screen: staff can type the code in.`,
  },
  {
    id: "gate",
    title: "Getting in on the night",
    text: `At the gate, staff scan your ticket's code. Each code gets in once: after it's scanned, the same code is turned away, so don't share a screenshot of your ticket before the event.

Doors usually open an hour before the start time on the event page. Bring your ID if the event is 18+: the gate staff will check it.

If your code says "already used" and you haven't been in, ask for the event organiser at the gate with your M-Pesa receipt. They can check who scanned it and when.`,
  },
  {
    id: "lost-phone",
    title: "Lost your phone?",
    text: `Log in to Tikiti on any phone or computer and go to "My tickets": your codes are there. Your tickets belong to your account, not your phone.

If you think someone else has your codes, contact support before the event and we'll issue new codes and cancel the old ones.`,
  },
  {
    id: "account",
    title: "Your account and password",
    text: `You need an account to buy tickets, so your tickets are safe even if you lose your phone. Sign up with your email and a password of at least 10 characters.

Forgot your password? Use "Forgot password" on the log in page and we'll email you a link. The link works for one hour.

To change your email address, contact support from the email address you signed up with.`,
  },
  {
    id: "group",
    title: "Buying for a group",
    text: `You can buy up to 10 tickets in one order. Everyone gets their own code under your account, and you can forward each code to a friend.

Some events have a "Group of 4" ticket: one ticket that lets four people in together, usually cheaper than four regular tickets. All four need to arrive together.`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    text: `Every event page says whether the venue has step-free access and accessible toilets. If it doesn't say, ask the organiser before you buy.

A companion who helps you gets in free at most events. Contact support after buying your own ticket and we'll arrange the companion ticket with the organiser.`,
  },
  {
    id: "organisers",
    title: "Selling tickets as an organiser",
    text: `To sell tickets on Tikiti, sign up and ask for an organiser account. Once you're approved, you can create events, set prices and capacity, and publish them.

Tikiti's fee is 5% of each ticket's price, taken before the money reaches you. Money from ticket sales is paid to your M-Pesa or bank account within 2 working days after the event.

On the night, open "Check-in" on your event page on a phone, and scan or type each ticket code at the gate.`,
  },
  {
    id: "support",
    title: "Contacting support",
    text: `Email help@tikiti.example, or use the chat on the website. We answer from 8am to 10pm, every day, and within an hour on event nights.

For problems at the gate on the night, ask for the event organiser first: they can check tickets on the spot.`,
  },
];
