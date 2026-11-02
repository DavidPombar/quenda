// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiWarning } from "react-icons/pi";
import { fullDateLabel, timeLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { ActivityClash, Locale } from "@/types/models";
const REASONS: Record<ActivityClash["reason"], TextKey> = {
  booking: "activityClashBooking",
  season: "activityClashSeason",
  activity: "activityClashActivity",
  waitlist_hold: "activityClashWaitlist",
  closed: "activityClashClosed",
};
/** Sessions that cannot be held, each with a way to skip that date (#97). */
export function ActivityClashes(p: {
  clashes: ActivityClash[];
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
  onAdd: (date: string) => void;
  onAddAll: () => void;
}) {
  const { t } = p;
  return (
    <div className="closure-warning" role="alert">
      <PiWarning size={24} aria-hidden="true" />
      <div>
        <h3>{t("activityClashesTitle")}</h3>
        <p>{t("activityClashesBody")}</p>
        <ul className="conflict-list clash-list">
          {p.clashes.map((clash) => {
            const date = fullDateLabel(clash.date, p.locale);
            return (
              <li key={clash.start}>
                <span>
                  {date}, {timeLabel(clash.start, p.timezone)}–
                  {timeLabel(clash.end, p.timezone)}: {t(REASONS[clash.reason])}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => p.onAdd(clash.date)}
                >
                  {fill(t("activityClashAdd"), { date })}
                </Button>
              </li>
            );
          })}
        </ul>
        {p.clashes.length > 1 && (
          <Button size="sm" variant="outline" onClick={p.onAddAll}>
            {t("activityClashAddAll")}
          </Button>
        )}
      </div>
    </div>
  );
}
