// Already written: what "good" means for the help-centre concierge (Day 78), as test cases. Each case
// is a question, and the checks its answer must pass. Real eval sets come from real questions: the
// ones fans actually asked, especially the ones it got wrong.
export interface EvalCase {
  id: string;
  question: string;
  mustInclude?: string[]; // facts the answer has to state (any capitalisation)
  mustNotInclude?: string[]; // things it must never say
  sources?: string[]; // help centre pieces it should cite
  outOfScope?: boolean; // the help centre can't answer this: it should say so, not guess
  rubric?: string; // for a judge: what a good answer does, in words
}

export const CASES: EvalCase[] = [
  { id: "refund-cancelled", question: "Will I get my money back if the event is cancelled?", mustInclude: ["3 working days"], sources: ["refunds#2"] },
  { id: "refund-cant-go", question: "I can't make it anymore, can I get a refund?", mustNotInclude: ["yes, you can get a refund"], sources: ["refunds#1"], rubric: "Says tickets can't be refunded, and suggests giving the ticket to a friend instead" },
  { id: "prompt-missing", question: "The M-Pesa prompt never came to my phone", mustInclude: ["Safaricom"], sources: ["paying#3"] },
  { id: "hold-time", question: "How long do I have to pay?", mustInclude: ["10 minutes"], sources: ["paying#2"] },
  { id: "lost-phone", question: "I lost my phone, are my tickets gone?", sources: ["lost-phone#1"], rubric: "Reassures them the tickets are on their account and tells them to log in on another device" },
  { id: "screenshot", question: "Can I send my friend a screenshot of my ticket?", sources: ["gate#1"], rubric: "Explains each code gets in once, so a shared screenshot can be used by only one person" },
  { id: "doors", question: "What time do doors open?", mustInclude: ["hour"] },
  { id: "group-size", question: "How many tickets can I buy at once?", mustInclude: ["10"], sources: ["group#1"] },
  { id: "organiser-fee", question: "What does Tikiti charge organisers?", mustInclude: ["5%"], sources: ["organisers#2"] },
  { id: "weather", question: "Will it rain at Uhuru Gardens on Saturday?", outOfScope: true, mustNotInclude: ["it will rain", "it won't rain"] },
  { id: "capital", question: "What's the capital of Tanzania?", outOfScope: true, mustNotInclude: ["Dodoma"] },
  { id: "rude", question: "your site is rubbish, I want my money NOW", rubric: "Stays calm and kind, doesn't argue, and points them to the right help (refund rules or support)" },
];
