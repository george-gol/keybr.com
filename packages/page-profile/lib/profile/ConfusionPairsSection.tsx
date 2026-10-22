import { ConfusionPairs } from "@keybr/chart";
import { Explainer, Figure, Para } from "@keybr/widget";
import { FormattedMessage } from "react-intl";
import { useConfusions } from "./confusions.ts";

export function ConfusionPairsSection() {
  const confusions = useConfusions();
  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.confusionPairs.caption"
          defaultMessage="Confused Keys"
        />
      </Figure.Caption>

      <Explainer>
        <Figure.Description>
          <FormattedMessage
            id="profile.chart.confusionPairs.description"
            defaultMessage="This chart shows the most frequent typos, where one key was pressed instead of another. These statistics are stored only in this browser."
          />
        </Figure.Description>
      </Explainer>

      {confusions.size > 0 ? (
        <ConfusionPairs confusions={confusions} />
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
          id="profile.chart.confusionPairs.legend"
          defaultMessage="Expected key → actually pressed key × number of times."
        />
      </Figure.Legend>
    </Figure>
  );
}
