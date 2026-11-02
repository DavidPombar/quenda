// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiClock,
  PiHourglassMedium,
  PiSquareHalf,
} from "react-icons/pi";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import { distinctResource } from "@/services/resources.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Locale, Municipality, WaitlistEntry } from "@/types/models";
/** One waiting list of the person (#96): their place in the queue, or the place held for them. */
export function WaitlistRow(p: {
  entry: WaitlistEntry;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  leaving: boolean;
  onAccept: () => void;
  onLeave: () => void;
}) {
  const zone = p.municipality.timezone;
  const offered = p.entry.status === "offered";
  const resource = distinctResource(p.entry.facilityName, p.entry.resourceName);
  return (
    <article className={`booking-row waitlist-row${offered ? " offered" : ""}`}>
      <div className="booking-title">
        <h2>{p.entry.facilityName}</h2>
        <span className={`booking-status ${offered ? "upcoming" : "waiting"}`}>
          <PiHourglassMedium size={18} aria-hidden="true" />
          {offered
            ? fill(p.t("waitlistHeld"), {
                time: timeLabel(p.entry.offerExpiresAt ?? "", zone),
              })
            : fill(p.t("waitlistPosition"), { position: p.entry.position })}
        </span>
      </div>
      <ul className="meta-list">
        {resource && (
          <li>
            <PiSquareHalf size={20} aria-hidden="true" />
            <span className="sr-only">{p.t("resource")}: </span>
            {resource}
          </li>
        )}
        <li>
          <PiCalendarBlank size={20} aria-hidden="true" />
          {bookingDayLabel(p.entry.start, zone, p.locale)}
        </li>
        <li className="booking-time">
          <PiClock size={20} aria-hidden="true" />
          {timeLabel(p.entry.start, zone)}–{timeLabel(p.entry.end, zone)}
        </li>
      </ul>
      <div className="booking-actions">
        {offered && (
          <Button colorPalette="court" onClick={p.onAccept}>
            {p.t("waitlistConfirm")}
          </Button>
        )}
        <Button variant="outline" onClick={p.onLeave} loading={p.leaving}>
          {p.t("waitlistLeave")}
        </Button>
      </div>
    </article>
  );
}
