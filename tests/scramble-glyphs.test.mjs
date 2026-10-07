import assert from "node:assert/strict";
import test from "node:test";
import {
  splitScrambleCharacters,
  isScrambleCharacter,
  randomizeScrambleText,
  splitScrambleUnits,
  isScrambleUnit,
} from "../src/lib/scramble-glyphs.ts";

const samples = [0, 0.17, 0.5, 0.83, 0.999999];

test("scramble segmentation preserves combining kana, variation selectors and emoji graphemes", () => {
  const graphemes = [
    "A",
    "か\u3099",
    "ハ\u309a",
    "辻\u{E0100}",
    "é",
    "e\u0301",
    "👩‍🍳",
    "🍵",
    "🇯🇵",
  ];
  const text = graphemes.join("");
  assert.deepEqual(splitScrambleCharacters(text), graphemes);
  assert.equal(splitScrambleCharacters(text).join(""), text);
  assert.deepEqual(splitScrambleCharacters(""), []);
  assert.equal(isScrambleCharacter("か\u3099"), true);
  assert.equal(isScrambleCharacter("ハ\u309a"), true);
  assert.equal(isScrambleCharacter("辻\u{E0100}"), true);
  for (const character of [
    "",
    " ",
    "。",
    "👩‍🍳",
    "🍵",
    "🇯🇵",
    "\u3099",
    "\u{E0100}",
  ]) {
    assert.equal(isScrambleCharacter(character), false, character);
  }
});

test("ASCII scrambling retains upper/lower case and digit classes without changing punctuation", () => {
  const text = "ATOMA uji-00 / 1 kg.\nNext!";
  const original = splitScrambleCharacters(text);
  assert.deepEqual(splitScrambleUnits(text), original);
  for (const value of samples) {
    const scrambled = splitScrambleCharacters(
      randomizeScrambleText(text, () => value),
    );
    assert.equal(scrambled.length, original.length);
    for (const [index, character] of original.entries()) {
      const pattern = /[A-Z]/.test(character)
        ? /^[A-Z]$/
        : /[a-z]/.test(character)
          ? /^[a-z]$/
          : /[0-9]/.test(character)
            ? /^[0-9]$/
            : null;
      if (pattern) assert.match(scrambled[index], pattern);
      else assert.equal(scrambled[index], character);
    }
  }
});

test("Chinese and Japanese glyphs scramble within their scripts, including one-character labels", () => {
  const cases = [
    ["木", /^\p{Script=Han}$/u],
    ["产", /^\p{Script=Han}$/u],
    ["產", /^\p{Script=Han}$/u],
    ["抹", /^\p{Script=Han}$/u],
    ["あ", /^\p{Script=Hiragana}$/u],
    ["ア", /^\p{Script=Katakana}$/u],
    ["か\u3099", /^\p{Script=Hiragana}\p{M}*$/u],
    ["ハ\u309a", /^\p{Script=Katakana}\p{M}*$/u],
    ["辻\u{E0100}", /^\p{Script=Han}\p{M}*$/u],
  ];
  for (const [character, script] of cases) {
    assert.equal(isScrambleCharacter(character), true);
    for (const value of samples) {
      const scrambled = randomizeScrambleText(character, () => value);
      assert.match(scrambled, script);
      assert.notEqual(
        scrambled,
        character,
        `CJK label must visibly change: ${character}`,
      );
      assert.equal(splitScrambleCharacters(scrambled).length, 1);
    }
  }
});

test("whitespace, punctuation, accented Latin and emoji remain intact during mixed-script scrambling", () => {
  const text = "ATOMA 京都，抹茶。が カフェ・é e\u0301 👩‍🍳🍵 🇯🇵\n\t（1 kg）";
  const original = splitScrambleCharacters(text);
  for (const value of samples) {
    const scrambled = splitScrambleCharacters(
      randomizeScrambleText(text, () => value),
    );
    assert.equal(scrambled.length, original.length);
    original.forEach((character, index) => {
      if (!isScrambleCharacter(character))
        assert.equal(scrambled[index], character);
    });
  }
  assert.equal(
    randomizeScrambleText("，。！？（）」』 \t\n👩‍🍳🍵"),
    "，。！？（）」』 \t\n👩‍🍳🍵",
  );
});

test("wrapped CJK units retain the original text and bind opening/closing punctuation", () => {
  const opening = new Set(Array.from("（［｛「『【〈《“‘"));
  const closing = new Set(Array.from("、。，．！？：；）］｝」』】〉》”’"));
  for (const text of [
    "「抹茶」、京都。（味わう）",
    "品嚐『抹茶風味』，了解產地。",
    "查看【抹茶特性】，选择所需规格。",
    "京都。\n「茶」を選ぶ。",
  ]) {
    const units = splitScrambleUnits(text);
    assert.equal(units.join(""), text);
    assert.ok(
      units.length > 1,
      "A passage must retain CJK wrapping opportunities",
    );
    for (const unit of units.filter((value) => value.trim())) {
      assert.equal(
        closing.has(splitScrambleCharacters(unit)[0]),
        false,
        `Orphan closing punctuation: ${unit}`,
      );
      assert.equal(
        opening.has(splitScrambleCharacters(unit).at(-1)),
        false,
        `Orphan opening punctuation: ${unit}`,
      );
    }
  }
});

test("Japanese small kana and prolonged-sound marks stay attached to their preceding unit", () => {
  const nonstarters = new Set(
    Array.from("ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー"),
  );
  const text = "キャラメルラテ、ゆっくりコーヒーを味わう。";
  const units = splitScrambleUnits(text);
  assert.equal(units.join(""), text);
  for (const unit of units) {
    assert.equal(
      nonstarters.has(splitScrambleCharacters(unit)[0]),
      false,
      unit,
    );
  }
});

test("mixed CJK copy keeps Latin names and product codes together without losing separators", () => {
  const text = "京都のATOMA UJI-00、WZKA-00の抹茶 / 1 kg。";
  const units = splitScrambleUnits(text);
  assert.equal(units.join(""), text);
  for (const run of ["ATOMA", "UJI-00", "WZKA-00"]) {
    assert.ok(
      units.some((unit) => unit.includes(run)),
      `Split Latin run: ${run}`,
    );
  }
  assert.ok(units.length > 3);
  assert.equal(isScrambleUnit("（茶）"), true);
  assert.equal(isScrambleUnit("UJI-00、"), true);
  for (const unit of ["", " ", "。", "🍵", "👩‍🍳", "é"]) {
    assert.equal(isScrambleUnit(unit), false, unit);
  }
});
