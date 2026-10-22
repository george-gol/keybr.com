import { test } from "node:test";
import { ConfusionMap } from "@keybr/textinput";
import { render } from "@testing-library/react";
import { deepEqual } from "rich-assert";
import { ConfusionMatrix } from "./ConfusionMatrix.tsx";

const E = /* "e" */ 0x0065;
const R = /* "r" */ 0x0072;
const W = /* "w" */ 0x0077;

test("render empty", () => {
  const r = render(<ConfusionMatrix confusions={ConfusionMap.empty} />);

  deepEqual(rows(r.container), [[""]]);

  r.unmount();
});

test("render only the keys with errors", () => {
  const confusions = ConfusionMap.empty.merge([
    { expected: E, actual: R, count: 42 },
    { expected: R, actual: E, count: 7 },
    { expected: E, actual: W, count: 1 },
  ]);

  const r = render(<ConfusionMatrix confusions={confusions} />);

  deepEqual(rows(r.container), [
    ["", "e", "r", "w"],
    ["e", "", "42", "1"],
    ["r", "7", "", ""],
    ["w", "", "", ""],
  ]);

  r.unmount();
});

function rows(container: HTMLElement): string[][] {
  return [...container.querySelectorAll("tr")].map((tr) =>
    [...tr.querySelectorAll("th,td")].map((cell) => cell.textContent!),
  );
}
