// Already written: the three ways fans write to Tikiti, and how to talk back in each.
export const LANGUAGES = ["english", "kiswahili", "sheng"] as const;
export type Language = (typeof LANGUAGES)[number];

// For the model: what each one is, so it can recognise it and answer in it.
export const LANGUAGE_GUIDE = `Fans write in one of three ways:
- english: English, maybe with a Kenyan flavour ("sawa", "pole").
- kiswahili: Standard Kiswahili, like "Nitapataje tiketi zangu?" or "Je, pesa yangu itarudishwa?".
- sheng: Nairobi street slang mixing Kiswahili, English and words of its own, like "Niaje, form ni gani na hii event?", "doh" (money), "mbogi" (crew), "manze", "si uko na tickets za Sato?". If a message mixes languages loosely and casually, it's sheng.`;

// How to write a reply in each. Numbers, prices, times and ticket codes are always written exactly,
// in digits, whatever the language: "KES 800", "10 minutes", "T12-9F3A…".
export const REPLY_STYLE: Record<Language, string> = {
  english: "Reply in friendly, simple English.",
  kiswahili: "Jibu kwa Kiswahili sanifu, rahisi na cha kirafiki. (Reply in simple, friendly standard Kiswahili.)",
  sheng: "Reply in light, friendly Sheng that any young Nairobian would understand, the way they wrote to you. Keep facts exact: numbers, prices, times and ticket codes in digits.",
};

// Fixed replies that need no model at all.
export const PHRASES: Record<"offTopic" | "noAnswer" | "declined", Record<Language, string>> = {
  offTopic: {
    english: "I can only help with Tikiti: events, tickets, M-Pesa payments and getting in. What can I do for you?",
    kiswahili: "Naweza kusaidia tu na mambo ya Tikiti: matukio, tiketi, malipo ya M-Pesa na kuingia. Nikusaidie na nini?",
    sheng: "Manze, mimi nasaidia tu na mambo za Tikiti: events, tickets, M-Pesa na kuingia gate. Nikusort aje?",
  },
  noAnswer: {
    english: "I'm not sure about that one. Email help@tikiti.example and someone will get back to you.",
    kiswahili: "Sina uhakika kuhusu hilo. Tuma barua pepe kwa help@tikiti.example na utajibiwa.",
    sheng: "Hiyo sina uhakika nayo. Tuma email kwa help@tikiti.example, watakucheki.",
  },
  declined: {
    english: "Sorry, I can't help with that.",
    kiswahili: "Samahani, siwezi kusaidia na hilo.",
    sheng: "Pole, hiyo siwezi kusaidia nayo.",
  },
};
