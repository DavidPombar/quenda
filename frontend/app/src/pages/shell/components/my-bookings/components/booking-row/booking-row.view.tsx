// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiCheck,
  PiClock,
  PiUserMinus,
  PiX,
} from "react-icons/pi";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import type { Booking, Locale, Municipality } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
const OUTCOMES = {
  upcoming: [PiCheck, "confirmed"],
  attended: [PiCheck, "attended"],
  no_show: [PiUserMinus, "noShow"],
  cancelled: [PiX, "cancelled"],
} as const satisfies Record<Booking["outcome"], readonly [unknown, TextKey]>;
export function BookingRow(p: {
  booking: Booking;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  canChange: boolean;
  onCancel: () => void;
  onChange: () => void;
}) {
  const [StatusIcon, label] = OUTCOMES[p.booking.outcome];
  const byMunicipality = p.booking.cancelledBy === "municipality";
  return (
    <article className={`booking-row sport-${p.booking.sport}`}>
      <div className="booking-title">
        <h2>{p.booking.facilityName}</h2>
        <span className={`booking-status ${p.booking.outcome}`}>
          <StatusIcon size={18} aria-hidden="true" />
          {p.t(byMunicipality ? "cancelledByMunicipality" : label)}
        </span>
      </div>
      {p.booking.cancellationReason && (
        <p className="booking-reason">
          {p.t("reason")}: {p.booking.cancellationReason}
        </p>
      )}
      <ul className="meta-list">
        <li>
          <PiCalendarBlank size={20} aria-hidden="true" />
          {bookingDayLabel(p.booking.start, p.municipality.timezone, p.locale)}
        </li>
        <li className="booking-time">
          <PiClock size={20} aria-hidden="true" />
          {timeLabel(p.booking.start, p.municipality.timezone)}–
          {timeLabel(p.booking.end, p.municipality.timezone)}
        </li>
        <li>
          <SportTag sport={p.booking.sport} label={p.t(p.booking.sport)} />
        </li>
      </ul>
      {p.canChange && (
        <div className="booking-actions">
          <Button size="lg" variant="outline" onClick={p.onChange}>
            {p.t("changeBooking")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            colorPalette="red"
            onClick={p.onCancel}
          >
            {p.t("cancelBooking")}
          </Button>
        </div>
      )}
    </article>
  );
}
