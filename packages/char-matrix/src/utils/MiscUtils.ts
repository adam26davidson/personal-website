import { FONT_SIZE } from "../constants";

export function charsToPixelsY(numChars: number): number {
  return numChars * FONT_SIZE;
}

export function charsToPixelsX(numChars: number): number {
  return (numChars * FONT_SIZE) / 2;
}

export function getPostIdFromTitle(title: string): string {
  return title.replace(/\s+/g, "-").toLowerCase();
}

export function toBold(text: string): string {
  // Convert each character in text to its bold equivalent
  return Array.from(text).map(toBoldChar).join("");
}

export function toBoldChar(char: string): string {
  // Check if the character is a letter
  if (char.match(/[A-Z]/)) {
    const boldCharValue = char.charCodeAt(0) + 0x1d400 - 0x41;
    return String.fromCodePoint(boldCharValue);
  } else if (char.match(/[a-z]/)) {
    const boldCharValue = char.charCodeAt(0) + 0x1d41a - 0x61;
    return String.fromCodePoint(boldCharValue);
  }
  // If it's not a letter, return the original character
  return char;
}

export function toNotBoldChar(char: string): string {
  // Check if the character is a bold letter by code point
  const codePoint = char.codePointAt(0);
  if (codePoint && codePoint >= 0x1d400 && codePoint <= 0x1d7ff) {
    return String.fromCharCode(codePoint - 0x1d400);
  }
  // If it's not a bold letter, return the original character
  return char;
}
