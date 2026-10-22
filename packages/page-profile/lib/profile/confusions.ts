import { useKeyboard } from "@keybr/keyboard";
import { ConfusionStore } from "@keybr/result";
import { useMemo } from "react";

export function useConfusions() {
  const { layout } = useKeyboard();
  return useMemo(
    () => new ConfusionStore(window.localStorage).load(layout),
    [layout],
  );
}
