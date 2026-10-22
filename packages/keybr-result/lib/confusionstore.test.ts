import { test } from "node:test";
import { Layout } from "@keybr/keyboard";
import { deepEqual, equal } from "rich-assert";
import { type ConfusionStorage, ConfusionStore } from "./confusionstore.ts";

const A = /* "a" */ 0x0061;
const E = /* "e" */ 0x0065;
const R = /* "r" */ 0x0072;
const X = /* "x" */ 0x0078;

test("load from an empty storage", () => {
  const store = new ConfusionStore(new FakeStorage());

  equal(store.load(Layout.EN_US).size, 0);
});

test("load without a storage", () => {
  const store = new ConfusionStore(null);

  equal(store.load(Layout.EN_US).size, 0);
  equal(store.append(Layout.EN_US, [{ expected: E, actual: R }]).size, 1);
});

test("ignore invalid data", () => {
  for (const item of [
    "invalid json",
    "null",
    "[]",
    JSON.stringify({ version: 999, layouts: { "en-us": [[E, R, 1]] } }),
    JSON.stringify({ version: 1, layouts: null }),
    JSON.stringify({ version: 1, layouts: { "en-us": "abc" } }),
  ]) {
    const store = new ConfusionStore(
      new FakeStorage([[ConfusionStore.key, item]]),
    );

    equal(store.load(Layout.EN_US).size, 0);
  }
});

test("accumulate confusions per layout", () => {
  const storage = new FakeStorage();

  new ConfusionStore(storage).append(Layout.EN_US, [
    { expected: E, actual: R },
    { expected: A, actual: X },
  ]);
  new ConfusionStore(storage).append(Layout.EN_US, [
    { expected: E, actual: R },
  ]);
  new ConfusionStore(storage).append(Layout.DE_DE, [
    { expected: A, actual: X },
  ]);

  const store = new ConfusionStore(storage);
  deepEqual(store.load(Layout.EN_US).topPairs(10), [
    { expected: E, actual: R, count: 2 },
    { expected: A, actual: X, count: 1 },
  ]);
  deepEqual(store.load(Layout.DE_DE).topPairs(10), [
    { expected: A, actual: X, count: 1 },
  ]);
  equal(store.load(Layout.FR_FR).size, 0);
});

test("do not write empty updates", () => {
  const storage = new FakeStorage();

  new ConfusionStore(storage).append(Layout.EN_US, []);

  deepEqual([...storage], []);
});

class FakeStorage implements ConfusionStorage, Iterable<[string, string]> {
  readonly #data: Map<string, string>;

  constructor(items: Iterable<[string, string]> = []) {
    this.#data = new Map(items);
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.#data.entries();
  }

  getItem(key: string): string | null {
    return this.#data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#data.set(key, value);
  }
}
