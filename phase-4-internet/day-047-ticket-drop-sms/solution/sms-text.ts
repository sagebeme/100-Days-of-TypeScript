// SMS has two alphabets. GSM-7 fits 160 characters in one message. Use a single character outside it
// (an emoji, a curly quote, "…") and the WHOLE message switches to UCS-2, which fits only 70.
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
// These are in GSM-7 too, but each one takes two spaces.
const GSM_EXTENDED = "^{}\\[~]|€\f";

export type Encoding = "GSM-7" | "UCS-2";

export interface SmsInfo {
  encoding: Encoding;
  length: number; // in the encoding's own units
  parts: number; // how many SMS you'll pay for
}

export function smsInfo(text: string): SmsInfo {
  let gsmLength = 0;
  for (const char of text) {
    if (GSM_BASIC.includes(char)) gsmLength += 1;
    else if (GSM_EXTENDED.includes(char)) gsmLength += 2;
    else {
      // Not GSM-7: UCS-2 counts UTF-16 units, so an emoji counts as 2.
      const length = text.length;
      return { encoding: "UCS-2", length, parts: length <= 70 ? 1 : Math.ceil(length / 67) };
    }
  }
  return { encoding: "GSM-7", length: gsmLength, parts: gsmLength <= 160 ? 1 : Math.ceil(gsmLength / 153) };
}

// Swaps the usual troublemakers (often pasted in from a phone or a word processor) for plain versions.
export function toGsmFriendly(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/…/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/[•·]/g, "-")
    .replace(/ /g, " ");
}
