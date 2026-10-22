import { type CodePoint, isWhitespace } from "@keybr/unicode";

/**
 * A single substitution error: the `actual` key was pressed
 * instead of the `expected` one.
 */
export type Confusion = {
  readonly expected: CodePoint;
  readonly actual: CodePoint;
};

export type ConfusionPair = Confusion & {
  readonly count: number;
};

export type ConfusionJson = readonly (readonly [
  expected: CodePoint,
  actual: CodePoint,
  count: number,
])[];

/**
 * Accumulated counts of the substitution errors.
 */
export class ConfusionMap implements Iterable<ConfusionPair> {
  static readonly empty = new ConfusionMap([]);

  static from(confusions: Iterable<Confusion>): ConfusionMap {
    return ConfusionMap.empty.merge(
      Array.from(confusions, ({ expected, actual }) => ({
        expected,
        actual,
        count: 1,
      })),
    );
  }

  static fromJSON(json: unknown): ConfusionMap {
    const pairs: ConfusionPair[] = [];
    if (Array.isArray(json)) {
      for (const item of json) {
        if (
          Array.isArray(item) &&
          item.length === 3 &&
          item.every((v) => Number.isSafeInteger(v) && v > 0)
        ) {
          const [expected, actual, count] = item as [number, number, number];
          pairs.push({ expected, actual, count });
        }
      }
    }
    return ConfusionMap.empty.merge(pairs);
  }

  readonly #data: Map<number, ConfusionPair>;

  constructor(pairs: Iterable<ConfusionPair>) {
    this.#data = new Map(
      Array.from(pairs, (pair) => [keyOf(pair.expected, pair.actual), pair]),
    );
  }

  [Symbol.iterator](): IterableIterator<ConfusionPair> {
    return this.#data.values();
  }

  get size(): number {
    return this.#data.size;
  }

  get(expected: CodePoint, actual: CodePoint): number {
    return this.#data.get(keyOf(expected, actual))?.count ?? 0;
  }

  merge(pairs: Iterable<ConfusionPair>): ConfusionMap {
    const data = new Map(this.#data);
    for (const { expected, actual, count } of pairs) {
      const key = keyOf(expected, actual);
      data.set(key, {
        expected,
        actual,
        count: (data.get(key)?.count ?? 0) + count,
      });
    }
    return new ConfusionMap(data.values());
  }

  /**
   * Returns the most frequent pairs sorted by count in descending order.
   */
  topPairs(limit: number): ConfusionPair[] {
    return [...this.#data.values()]
      .sort(
        (a, b) =>
          b.count - a.count || a.expected - b.expected || a.actual - b.actual,
      )
      .slice(0, limit);
  }

  /**
   * Returns the sorted list of all keys involved in the errors.
   */
  codePoints(): CodePoint[] {
    const set = new Set<CodePoint>();
    for (const { expected, actual } of this.#data.values()) {
      set.add(expected);
      set.add(actual);
    }
    return [...set].sort((a, b) => a - b);
  }

  toJSON(): ConfusionJson {
    return this.topPairs(this.#data.size).map(
      ({ expected, actual, count }) => [expected, actual, count] as const,
    );
  }
}

/**
 * Normalizes a pair of mismatched characters into a key confusion.
 * Returns null if the pair is not a real substitution of one key with another,
 * such as a missed Shift or a misplaced whitespace.
 */
export function toConfusion(
  expected: CodePoint,
  actual: CodePoint,
): Confusion | null {
  if (isWhitespace(expected) || isWhitespace(actual)) {
    return null;
  }
  expected = toLowerCase(expected);
  actual = toLowerCase(actual);
  if (expected === actual) {
    return null;
  }
  return { expected, actual };
}

function toLowerCase(codePoint: CodePoint): CodePoint {
  const lower = String.fromCodePoint(codePoint).toLowerCase();
  return lower.length === String.fromCodePoint(codePoint).length
    ? lower.codePointAt(0)!
    : codePoint;
}

function keyOf(expected: CodePoint, actual: CodePoint): number {
  return expected * 0x110000 + actual;
}
