import { ConfusionMatrix } from "@keybr/chart";
import { Explainer, Figure, Para } from "@keybr/widget";
import { FormattedMessage } from "react-intl";
import { useConfusions } from "./confusions.ts";

export function ConfusionMatrixSection() {
  const confusions = useConfusions();
  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.confusionMatrix.caption"
          defaultMessage="Key Confusion Matrix"
        />
      </Figure.Caption>

      <Explainer>
        <Figure.Description>
          <FormattedMessage
            id="profile.chart.confusionMatrix.description"
            defaultMessage="This chart shows how often each key was pressed instead of another key. Only the keys involved in typos are shown."
          />
        </Figure.Description>
      </Explainer>

      {confusions.size > 0 ? (
        <ConfusionMatrix confusions={confusions} />
      ) : (
        <Para>
          <FormattedMessage
            id="profile.chart.confusions.empty"
            defaultMessage="No confused keys recorded yet."
          />
        </Para>
      )}

      <Figure.Legend>
        <FormattedMessage
          id="profile.chart.confusionMatrix.legend"
          defaultMessage="Rows: expected keys. Columns: actually pressed keys. Cell color: relative number of typos."
        />
      </Figure.Legend>
    </Figure>
  );
}
