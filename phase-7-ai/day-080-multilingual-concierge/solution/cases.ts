import type { EvalCase } from "../../day-079-evals/starter/cases.ts";
import type { Language } from "./languages.ts";

// Already written: Day 79's kind of eval, for every language. The same facts must come out whichever
// language the question comes in, and the reply must come back in that language.
export interface MultilingualCase extends EvalCase {
  language: Language;
}

export const MULTILINGUAL_CASES: MultilingualCase[] = [
  { id: "refund-en", language: "english", question: "Will I get my money back if the event is cancelled?", mustInclude: ["3"], sources: ["refunds#2"] },
  { id: "refund-sw", language: "kiswahili", question: "Je, nitarudishiwa pesa zangu tukio likighairiwa?", mustInclude: ["3"], sources: ["refunds#2"] },
  { id: "refund-sheng", language: "sheng", question: "Manze, doh yangu itarudi kama event imecancelliwa?", mustInclude: ["3"], sources: ["refunds#2"] },
  { id: "prompt-sw", language: "kiswahili", question: "Sijapokea ujumbe wa M-Pesa wa kulipa", mustInclude: ["Safaricom"] },
  { id: "prompt-sheng", language: "sheng", question: "Prompt ya M-Pesa haijakam kwa simu yangu, niaje?", mustInclude: ["Safaricom"] },
  { id: "lost-phone-sheng", language: "sheng", question: "Nimepoteza simu, tickets zangu zimeenda?", sources: ["lost-phone#1"], rubric: "Reassures them the tickets are on their account and says to log in on another device" },
  { id: "hold-sw", language: "kiswahili", question: "Nina muda gani kulipa baada ya kuagiza?", mustInclude: ["10"] },
  { id: "joke-sheng", language: "sheng", question: "Niambie joke moja poa", outOfScope: true },
];
