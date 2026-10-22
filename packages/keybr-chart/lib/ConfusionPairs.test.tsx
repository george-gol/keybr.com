import { test } from "node:test";
import { ConfusionMap } from "@keybr/textinput";
import { render } from "@testing-library/react";
import { deepEqual } from "rich-assert";
import { ConfusionPairs } from "./ConfusionPairs.tsx";

const A = /* "a" */ 0x0061;
const E = /* "e" */ 0x0065;
const R = /* "r" */ 0x0072;
const X = /* "x" */ 0x0078;

test("render empty", () => {
  const r = render(<ConfusionPairs confusions={ConfusionMap.empty} />);

  deepEqual(rows(r.container), []);

  r.unmount();
});

test("render the most frequent pairs", () => {
  const confusions = ConfusionMap.empty.merge([
    { expected: A, actual: X, count: 1 },
    { expected: E, actual: R, count: 42 },
    { expected: R, actual: E, count: 7 },
  ]);

  const r = render(<ConfusionPairs confusions={confusions} limit={2} />);

  deepEqual(rows(r.container), ["e→r×42", "r→e×7"]);

  r.unmount();
});

function rows(container: HTMLElement): string[] {
  return [...container.querySelectorAll("tr")].map((tr) => tr.textContent!);
}
