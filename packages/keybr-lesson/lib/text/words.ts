import { type Language } from "@keybr/keyboard";
import {
  type Filter,
  type Letter,
  type PhoneticModel,
} from "@keybr/phonetic-model";
import { randomSample, type RNG, weightedRandomSample } from "@keybr/rand";
import { type CodePoint, toCodePoints } from "@keybr/unicode";

export type WordGenerator = () => string | "" | null;

export function phoneticWords(
  model: PhoneticModel,
  filter: Filter,
  random: RNG,
): WordGenerator {
  return () => {
    return model.nextWord(filter, random) || null;
  };
}

export function randomWords(
  wordList: readonly string[],
  random: RNG,
): WordGenerator {
  return () => {
    if (wordList.length > 0) {
      return randomSample(wordList, random);
    } else {
      return null;
    }
  };
}

export function wordSequence(
  wordList: readonly string[],
  cursor: { wordIndex: number },
): WordGenerator {
  return () => {
    const { length } = wordList;
    if (length > 0) {
      let { wordIndex } = cursor;
      if (wordIndex >= length) {
        wordIndex = 0;
      }
      const word = wordList[wordIndex];
      cursor.wordIndex = wordIndex + 1;
      return word;
    } else {
      return null;
    }
  };
}

export type ConfusedPair = {
  readonly a: CodePoint;
  readonly b: CodePoint;
  /** The relative frequency of the confusion in the range (0, 1]. */
  readonly weight: number;
};

/**
 * Prefers the words which contain both keys of the frequently confused pairs.
 * Picks one of a few candidate words, where each word has the weight
 * `1 + min(1, sum of the weights of the pairs found in the word)`,
 * so a word with a confused pair is at most twice as likely to be chosen.
 */
export function confusedWords(
  nextWord: WordGenerator,
  pairs: readonly ConfusedPair[],
  random: RNG,
  candidates = 3,
): WordGenerator {
  if (pairs.length === 0) {
    return nextWord;
  }
  return () => {
    const words: string[] = [];
    while (words.length < candidates) {
      const word = nextWord();
      if (word == null || word === "") {
        break;
      }
      words.push(word);
    }
    if (words.length === 0) {
      return null;
    }
    return weightedRandomSample(
      words,
      (word) => 1 + Math.min(1, confusionScore(word, pairs)),
      random,
    );
  };
}

export function confusionScore(
  word: string,
  pairs: readonly ConfusedPair[],
): number {
  const codePoints = new Set(toCodePoints(word));
  let score = 0;
  for (const { a, b, weight } of pairs) {
    if (codePoints.has(a) && codePoints.has(b)) {
      score += weight;
    }
  }
  return score;
}

export function uniqueWords(nextWord: WordGenerator): WordGenerator {
  let last = "";
  return () => {
    let n = 0;
    let word = null;
    while (n < 3) {
      word = nextWord();
      if (word == null || word === "") {
        return null;
      }
      if (word !== last) {
        last = word;
        return word;
      }
      n++;
    }
    return word;
  };
}

export function mangledWords(
  nextWord: WordGenerator,
  language: Language,
  punctuators: readonly Letter[],
  {
    withCapitals = 0,
    withPunctuators = 0,
  }: {
    withCapitals?: number;
    withPunctuators?: number;
  },
  random: RNG,
): WordGenerator {
  return () => {
    let word = nextWord();
    if (word == null || word === "") {
      return null;
    }
    if (withCapitals > 0 && withCapitals >= random()) {
      word = language.capitalCase(word);
    }
    if (withPunctuators > 0 && withPunctuators >= random()) {
      const { codePoint } = weightedRandomSample(
        punctuators,
        ({ f }) => f,
        random,
      );
      switch (codePoint) {
        case 33:
          word = `${word}!`;
          break;
        case 34:
          word = `"${word}"`;
          break;
        case 39:
          word = `'${word}'`;
          break;
        case 44:
          word = `${word},`;
          break;
        case 45:
          word = `${word}-${nextWord()}`;
          break;
        case 46:
          word = `${word}.`;
          break;
        case 58:
          word = `${word}:`;
          break;
        case 59:
          word = `${word};`;
          break;
        case 63:
          word = `${word}?`;
          break;
      }
    }
    return word;
  };
}
