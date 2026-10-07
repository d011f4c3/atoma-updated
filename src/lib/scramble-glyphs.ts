/** Keep combining marks attached in both the measured and animated text. */
const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

export function splitScrambleCharacters(text: string): string[] {
  if (segmenter)
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  // Older browsers still keep CJK combining marks and variation selectors
  // together; unsupported symbols stay unanimated in the renderer.
  return text.match(/\P{M}\p{M}*|\p{M}+/gu) ?? [];
}

const digitGlyphs = "0123456789";
const upperGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerGlyphs = "abcdefghijklmnopqrstuvwxyz";
// These Han forms are shared by Simplified/Traditional Chinese and Japanese.
const hanGlyphs = "木日月山水火土石田川林竹花茶白青空雨光";
const hiraganaGlyphs = "あいうえおかきくけこさしすせそたちつてとなにぬねの";
const katakanaGlyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノ";

function alphabetFor(character: string): string | undefined {
  if (/^[0-9]$/.test(character)) return digitGlyphs;
  if (/^[A-Z]$/.test(character)) return upperGlyphs;
  if (/^[a-z]$/.test(character)) return lowerGlyphs;
  if (/^\p{Script=Han}\p{M}*$/u.test(character)) return hanGlyphs;
  if (/^\p{Script=Hiragana}\p{M}*$/u.test(character)) return hiraganaGlyphs;
  if (/^\p{Script=Katakana}\p{M}*$/u.test(character)) return katakanaGlyphs;
  return undefined;
}

export function isScrambleCharacter(character: string): boolean {
  return alphabetFor(character) !== undefined;
}

/** Group CJK line-break units without changing the English character layout. */
export function hasCjkCharacters(text: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text);
}

const openingPunctuation = /^[\p{Ps}\p{Pi}]$/u;
const nonStartingCharacter =
  /^[\p{Pe}\p{Pf}、。，．！？：；,.!?:;ー々ゝゞヽヾぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ]$/u;
const asciiRunCharacter = /^[a-z0-9_./'-]$/i;

export function splitScrambleUnits(text: string): string[] {
  const characters = splitScrambleCharacters(text);
  if (!hasCjkCharacters(text)) return characters;
  const units: string[] = [];
  let opening = "";
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]!;
    if (openingPunctuation.test(character)) {
      opening += character;
      continue;
    }
    const previous = units.at(-1);
    if (
      !opening &&
      nonStartingCharacter.test(character) &&
      previous &&
      !/\s$/u.test(previous)
    ) {
      units[units.length - 1] += character;
      continue;
    }
    let unit = opening + character;
    opening = "";
    // Keep embedded names/codes such as ATOMA and UJI-00 on one line.
    if (asciiRunCharacter.test(character)) {
      while (
        index + 1 < characters.length &&
        asciiRunCharacter.test(characters[index + 1]!)
      ) {
        unit += characters[++index];
      }
    }
    units.push(unit);
  }
  if (opening) units.push(opening);
  return units;
}

export function isScrambleUnit(unit: string): boolean {
  return splitScrambleCharacters(unit).some(isScrambleCharacter);
}

export function randomizeScrambleText(
  text: string,
  random: () => number = Math.random,
): string {
  return splitScrambleCharacters(text)
    .map((character) => {
      const alphabet = alphabetFor(character);
      if (!alphabet) return character;
      // Preserve the existing ASCII effect. CJK labels can be only one glyph,
      // so always pick a different glyph to make their pulse visible as well.
      const candidates = /^[a-z0-9]$/i.test(character)
        ? alphabet
        : alphabet.replace(character, "");
      return candidates.charAt(Math.floor(random() * candidates.length));
    })
    .join("");
}
