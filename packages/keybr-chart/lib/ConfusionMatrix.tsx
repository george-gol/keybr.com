import { type ConfusionMap } from "@keybr/textinput";
import { type ReactNode } from "react";
import * as styles from "./Confusions.module.less";

export function ConfusionMatrix({
  confusions,
}: {
  readonly confusions: ConfusionMap;
}): ReactNode {
  const codePoints = confusions.codePoints();
  let max = 1;
  for (const { count } of confusions) {
    max = Math.max(max, count);
  }
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th />
          {codePoints.map((actual) => (
            <th key={actual} className={styles.key}>
              {String.fromCodePoint(actual)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {codePoints.map((expected) => (
          <tr key={expected}>
            <th className={styles.key}>{String.fromCodePoint(expected)}</th>
            {codePoints.map((actual) => {
              const count = confusions.get(expected, actual);
              return (
                <td
                  key={actual}
                  className={styles.cell}
                  title={
                    count > 0
                      ? `${String.fromCodePoint(expected)} → ${String.fromCodePoint(actual)} ×${count}`
                      : undefined
                  }
                >
                  {count > 0 && (
                    <>
                      <div
                        className={styles.heat}
                        style={{ opacity: count / max }}
                      />
                      <span className={styles.cellValue}>{count}</span>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
