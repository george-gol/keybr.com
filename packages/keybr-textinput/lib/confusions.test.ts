import { test } from "node:test";
import { toCodePoints } from "@keybr/unicode";
import { deepEqual, equal, isNull } from "rich-assert";
import { ConfusionMap, toConfusion } from "./confusions.ts";
import { type TextInputSettings } from "./settings.ts";
import { TextInput } from "./textinput.ts";

const A = /* "a" */ 0x0061;
const B = /* "b" */ 0x0062;
const E = /* "e" */ 0x0065;
const R = /* "r" */ 0x0072;
const X = /* "x" */ 0x0078;
const UpperA = /* "A" */ 0x0041;
const UpperX = /* "X" */ 0x0058;
const Space = /* SPACE */ 0x0020;

const strict: TextInputSettings = {
  stopOnError: true,
  forgiveErrors: false,
  spaceSkipsWords: false,
};
const forgiving: TextInputSettings = {
  stopOnError: true,
  forgiveErrors: true,
  spaceSkipsWords: true,
};
const garbage: TextInputSettings = {
  stopOnError: false,
  forgiveErrors: false,
  spaceSkipsWords: false,
};

test("normalize a confusion", () => {
  deepEqual(toConfusion(A, X), { expected: A, actual: X });
  deepEqual(toConfusion(UpperA, UpperX), { expected: A, actual: X });
  isNull(toConfusion(UpperA, A));
  isNull(toConfusion(A, Space));
  isNull(toConfusion(Space, A));
});

test("empty confusion map", () => {
  const map = ConfusionMap.empty;

  equal(map.size, 0);
  equal(map.get(A, X), 0);
  deepEqual(map.topPairs(10), []);
  deepEqual(map.codePoints(), []);
  deepEqual(map.toJSON(), []);
});

test("aggregate confusions", () => {
  const map = ConfusionMap.from([
    { expected: E, actual: R },
    { expected: A, actual: X },
    { expected: E, actual: R },
    { expected: R, actual: E },
    { expected: E, actual: R },
    { expected: A, actual: X },
  ]);

  equal(map.size, 3);
  equal(map.get(E, R), 3);
  equal(map.get(A, X), 2);
  equal(map.get(R, E), 1);
  equal(map.get(X, A), 0);
  deepEqual(map.topPairs(2), [
    { expected: E, actual: R, count: 3 },
    { expected: A, actual: X, count: 2 },
  ]);
  deepEqual(map.codePoints(), [A, E, R, X]);
});

test("merge confusion maps", () => {
  const map = ConfusionMap.from([{ expected: E, actual: R }]).merge([
    { expected: E, actual: R, count: 2 },
    { expected: A, actual: X, count: 5 },
  ]);

  deepEqual(map.topPairs(10), [
    { expected: A, actual: X, count: 5 },
    { expected: E, actual: R, count: 3 },
  ]);
});

test("serialize confusion maps", () => {
  const map = ConfusionMap.from([
    { expected: E, actual: R },
    { expected: E, actual: R },
    { expected: A, actual: X },
  ]);

  const json = JSON.parse(JSON.stringify(map));

  deepEqual(json, [
    [E, R, 2],
    [A, X, 1],
  ]);
  deepEqual(ConfusionMap.fromJSON(json).topPairs(10), map.topPairs(10));
});

test("ignore invalid json", () => {
  equal(ConfusionMap.fromJSON(null).size, 0);
  equal(ConfusionMap.fromJSON({}).size, 0);
  equal(ConfusionMap.fromJSON("abc").size, 0);
  deepEqual(
    ConfusionMap.fromJSON([
      [E, R, 1],
      [E, R],
      [E, R, -1],
      [E, "r", 1],
      null,
    ]).topPairs(10),
    [{ expected: E, actual: R, count: 1 }],
  );
});

test("collect a substituted character", () => {
  for (const settings of [strict, forgiving, garbage]) {
    const textInput = new TextInput("abcd", settings);

    type(textInput, "a");
    type(textInput, "x"); // Wrong key instead of "b".
    if (settings.stopOnError) {
      type(textInput, "bcd");
    } else {
      textInput.clearChar();
      type(textInput, "bcd");
    }

    deepEqual(textInput.confusions, [{ expected: B, actual: X }]);
  }
});

test("collect a replaced character", () => {
  const textInput = new TextInput("abcde", forgiving);

  type(textInput, "axcde"); // Recovered automatically.

  deepEqual(textInput.confusions, [{ expected: B, actual: X }]);
});

test("collect only the first wrong key at a position", () => {
  const textInput = new TextInput("abcd", strict);

  type(textInput, "axed"); // Two wrong keys at the same position.
  type(textInput, "bcd");

  deepEqual(textInput.confusions, [{ expected: B, actual: X }]);
});

test("collect a substitution after a backspace", () => {
  const textInput = new TextInput("abcd", garbage);

  type(textInput, "axcd"); // Accumulate garbage.
  textInput.clearChar();
  textInput.clearChar();
  textInput.clearChar();
  type(textInput, "bcd");

  deepEqual(textInput.confusions, [{ expected: B, actual: X }]);
});

test("ignore a backspace without a wrong key", () => {
  const textInput = new TextInput("abcd", garbage);

  type(textInput, "a");
  textInput.clearChar();
  type(textInput, "bcd");

  deepEqual(textInput.confusions, []);
});

test("ignore a missed shift", () => {
  const textInput = new TextInput("aXcd", strict);

  type(textInput, "a");
  type(textInput, "x"); // Lowercase instead of uppercase.
  type(textInput, "Xcd");

  deepEqual(textInput.confusions, []);
});

test("normalize case of a substitution", () => {
  const textInput = new TextInput("aBcd", strict);

  type(textInput, "a");
  type(textInput, "X");
  type(textInput, "Bcd");

  deepEqual(textInput.confusions, [{ expected: B, actual: X }]);
});

test("ignore a skipped character", () => {
  for (const settings of [strict, forgiving]) {
    const textInput = new TextInput("abcde", settings);

    type(textInput, "a");
    type(textInput, "c"); // Skipped "b".
    if (settings.forgiveErrors) {
      type(textInput, "de"); // Recovered automatically.
    } else {
      type(textInput, "bcde");
    }

    deepEqual(textInput.confusions, []);
  }
});

test("ignore a repeated character", () => {
  const textInput = new TextInput("abcd", strict);

  type(textInput, "a");
  type(textInput, "a"); // Extra "a".
  type(textInput, "bcd");

  deepEqual(textInput.confusions, []);
});

test("ignore an inserted character", () => {
  const textInput = new TextInput("abcd", garbage);

  type(textInput, "a");
  type(textInput, "x"); // Extra "x".
  type(textInput, "b");
  textInput.clearChar();
  textInput.clearChar();
  type(textInput, "bcd");

  deepEqual(textInput.confusions, []);
});

test("ignore whitespace", () => {
  const textInput = new TextInput("ab cd", strict);

  type(textInput, "a ");
  type(textInput, "bx"); // Wrong key instead of space.
  type(textInput, " cd");

  deepEqual(textInput.confusions, []);
});

test("ignore skipped words", () => {
  const textInput = new TextInput("abc abc", forgiving);

  type(textInput, "ax");
  type(textInput, " abc"); // Space skips the word.

  deepEqual(textInput.confusions, []);
});

test("reset confusions", () => {
  const textInput = new TextInput("abcd", strict);

  type(textInput, "ax");
  type(textInput, "bcd");
  textInput.reset();

  deepEqual(textInput.confusions, []);
});

function type(textInput: TextInput, text: string): void {
  for (const codePoint of toCodePoints(text)) {
    textInput.appendChar(0, codePoint, 0);
  }
}
