import { type ConfusionMap } from "@keybr/textinput";
import { type ReactNode } from "react";
import * as styles from "./Confusions.module.less";

export function ConfusionPairs({
  confusions,
  limit = 10,
}: {
  readonly confusions: ConfusionMap;
  readonly limit?: number;
}): ReactNode {
  const pairs = confusions.topPairs(limit);
  const max = pairs.length > 0 ? pairs[0].count : 1;
  return (
    <table className={styles.table}>
      <tbody>
        {pairs.map(({ expected, actual, count }) => (
          <tr key={`${expected}:${actual}`}>
            <td className={styles.key}>{String.fromCodePoint(expected)}</td>
            <td className={styles.arrow}>→</td>
            <td className={styles.key}>{String.fromCodePoint(actual)}</td>
            <td className={styles.barCell}>
              <div
                className={styles.bar}
                style={{ inlineSize: `${(count / max) * 100}%` }}
              />
            </td>
            <td className={styles.count}>×{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
