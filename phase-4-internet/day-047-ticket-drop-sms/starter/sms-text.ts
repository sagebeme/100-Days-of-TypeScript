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
  // TODO: go through the text character by character (for...of):
  //   in GSM_BASIC -> 1 unit; in GSM_EXTENDED -> 2 units;
  //   anything else -> the whole message is UCS-2: length is text.length, 70 fit in one SMS, 67 per part
  // TODO: GSM-7: 160 units fit in one SMS, otherwise 153 per part
  throw new Error("not implemented yet");
}

// Swaps the usual troublemakers (often pasted in from a phone or a word processor) for plain versions.
export function toGsmFriendly(text: string): string {
  // TODO: curly single quotes -> ', curly double quotes -> ", … -> ..., en and em dashes -> -,
  //       bullets and middle dots -> -, non-breaking spaces (\u00a0) -> a normal space
  throw new Error("not implemented yet");
}
