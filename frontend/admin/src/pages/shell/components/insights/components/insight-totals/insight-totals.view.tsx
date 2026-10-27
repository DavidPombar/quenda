// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  hoursLabel,
  percentLabel,
  pointsDelta,
} from "@/services/insights.service";
import type { TextKey } from "@/services/i18n.service";
import type { Insights, Locale } from "@/types/models";
export function InsightTotals(p: {
  current: Insights;
  previous: Insights | null;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const { t, current, previous } = p;
  const delta = pointsDelta(current.occupancy, previous?.occupancy ?? null);
  const cards: {
    label: TextKey;
    value: string | number;
    before?: string | number;
    note?: string;
  }[] = [
    {
      label: "insightsOccupancy",
      value: percentLabel(current.occupancy),
      before: previous ? percentLabel(previous.occupancy) : undefined,
      note: delta ? `${delta} ${t("insightsPoints")}` : undefined,
    },
    {
      label: "insightsBookedHours",
      value: hoursLabel(current.bookedMinutes, p.locale),
      before: previous
        ? hoursLabel(previous.bookedMinutes, p.locale)
        : undefined,
      note: `${t("insightsOf")} ${hoursLabel(current.openMinutes, p.locale)} ${t("insightsOpenSuffix")}`,
    },
    {
      label: "insightsConfirmed",
      value: current.confirmed,
      before: previous?.confirmed,
    },
    {
      label: "insightsCancelled",
      value: current.cancelled,
      before: previous?.cancelled,
    },
    {
      label: "insightsNoShows",
      value: current.noShows ?? "—",
      note: current.noShows === null ? t("insightsNoShowsPending") : undefined,
    },
  ];
  return (
    <dl className="stats-strip insight-totals">
      {cards.map((card) => (
        <div key={card.label} className="stat">
          <dt>{t(card.label)}</dt>
          <dd className="stat-value">{card.value}</dd>
          {card.before !== undefined && (
            <dd className="stat-hint">
              {t("insightsBefore")}: {card.before}
            </dd>
          )}
          {card.note && <dd className="stat-hint">{card.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
