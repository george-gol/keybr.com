import { type Layout } from "@keybr/keyboard";
import { type Confusion, ConfusionMap } from "@keybr/textinput";

export type ConfusionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/**
 * Persists the accumulated key confusions in the local storage.
 * The confusions are stored separately from the results,
 * so the results format is not affected.
 */
export class ConfusionStore {
  static readonly key = "keybr.confusions";
  static readonly version = 1;

  readonly #storage: ConfusionStorage | null;

  constructor(storage: ConfusionStorage | null) {
    this.#storage = storage;
  }

  load(layout: Layout): ConfusionMap {
    return ConfusionMap.fromJSON(this.#read()[layout.id]);
  }

  append(layout: Layout, confusions: readonly Confusion[]): ConfusionMap {
    const map = this.load(layout).merge(ConfusionMap.from(confusions));
    if (confusions.length > 0) {
      this.#write({ ...this.#read(), [layout.id]: map.toJSON() });
    }
    return map;
  }

  #read(): Record<string, unknown> {
    if (this.#storage != null) {
      try {
        const item = this.#storage.getItem(ConfusionStore.key);
        if (item != null) {
          const json = JSON.parse(item);
          if (
            json != null &&
            typeof json === "object" &&
            json.version === ConfusionStore.version &&
            json.layouts != null &&
            typeof json.layouts === "object"
          ) {
            return json.layouts;
          }
        }
      } catch {
        // Ignore invalid data.
      }
    }
    return {};
  }

  #write(layouts: Record<string, unknown>): void {
    if (this.#storage != null) {
      try {
        this.#storage.setItem(
          ConfusionStore.key,
          JSON.stringify({ version: ConfusionStore.version, layouts }),
        );
      } catch {
        // Ignore quota errors.
      }
    }
  }
}
