import { test } from "node:test";
import { FakeRNGStream, LCG } from "@keybr/rand";
import { equal, isNull, isTrue } from "rich-assert";
import {
  confusedWords,
  confusionScore,
  randomWords,
  uniqueWords,
  wordSequence,
} from "./words.ts";

const A = /* "a" */ 0x0061;
const B = /* "b" */ 0x0062;
const C = /* "c" */ 0x0063;
const D = /* "d" */ 0x0064;

test("random words", () => {
  const rng = FakeRNGStream(3);

  isNull(randomWords([], rng)());

  const wordList = ["a", "b", "c"];

  equal(randomWords(wordList, rng)(), "a");
  equal(randomWords(wordList, rng)(), "b");
  equal(randomWords(wordList, rng)(), "c");
});

test("word sequence", () => {
  isNull(wordSequence([], { wordIndex: 0 })());

  const wordList = ["a", "b", "c"];
  const cursor = { wordIndex: 100 };

  equal(wordSequence(wordList, cursor)(), "a");
  equal(cursor.wordIndex, 1);
  equal(wordSequence(wordList, cursor)(), "b");
  equal(cursor.wordIndex, 2);
  equal(wordSequence(wordList, cursor)(), "c");
  equal(cursor.wordIndex, 3);
  equal(wordSequence(wordList, cursor)(), "a");
  equal(cursor.wordIndex, 1);
});

test("unique words", () => {
  isNull(uniqueWords(wordSequence([], { wordIndex: 0 }))());
  isNull(uniqueWords(randomWords([], () => 0))());

  const words = uniqueWords(
    wordSequence(["a", "a", "b", "b", "c"], { wordIndex: 0 }),
  );

  equal(words(), "a");
  equal(words(), "b");
  equal(words(), "c");
  equal(words(), "a");
  equal(words(), "b");
});

test("confusion score", () => {
  const pairs = [
    { a: A, b: B, weight: 1 },
    { a: C, b: D, weight: 0.5 },
  ];

  equal(confusionScore("xyz", pairs), 0);
  equal(confusionScore("axy", pairs), 0);
  equal(confusionScore("bxa", pairs), 1);
  equal(confusionScore("dxc", pairs), 0.5);
  equal(confusionScore("abcd", pairs), 1.5);
});

test("confused words without pairs", () => {
  const nextWord = randomWords(["a", "b", "c"], () => 0);

  equal(
    confusedWords(nextWord, [], () => 0),
    nextWord,
  );
});

test("confused words from empty word list", () => {
  isNull(
    confusedWords(
      randomWords([], () => 0),
      [{ a: A, b: B, weight: 1 }],
      () => 0,
    )(),
  );
});

test("confused words prefer words with confused pairs", () => {
  const rng = LCG(1);
  const wordList = ["abx", "cxy", "dxy"];
  const count = (words: () => string | null) => {
    let n = 0;
    for (let i = 0; i < 3000; i++) {
      if (words() === "abx") {
        n++;
      }
    }
    return n / 3000;
  };

  const baseline = count(randomWords(wordList, rng));
  const weighted = count(
    confusedWords(randomWords(wordList, rng), [{ a: A, b: B, weight: 1 }], rng),
  );

  // The exact probability is 1/3 without and 59/135 with the confused pairs.
  isTrue(baseline > 0.3 && baseline < 0.37);
  isTrue(weighted > 0.4 && weighted < 0.48);
});
