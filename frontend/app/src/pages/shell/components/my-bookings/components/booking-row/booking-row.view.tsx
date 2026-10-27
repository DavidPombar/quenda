// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiCalendarBlank, PiCheck, PiClock, PiTag, PiX } from "react-icons/pi";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { bookingDayLabel, money, timeLabel } from "@/services/date.service";
import { categoryLabel } from "@/services/tariff.service";
import type { Booking, Locale, Municipality } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
export function BookingRow(p: {
  booking: Booking;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  canChange: boolean;
  onCancel: () => void;
  onChange: () => void;
}) {
  const StatusIcon = p.booking.status === "confirmed" ? PiCheck : PiX;
  return (
    <article className={`booking-row sport-${p.booking.sport}`}>
      <div className="booking-title">
        <h2>{p.booking.facilityName}</h2>
        <span className={`booking-status ${p.booking.status}`}>
          <StatusIcon size={18} aria-hidden="true" />
          {p.t(p.booking.status)}
        </span>
      </div>
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
        {p.booking.priceCents !== null && p.booking.tariffCategory && (
          <li>
            <PiTag size={20} aria-hidden="true" />
            {p.booking.priceCents
              ? money(p.booking.priceCents, p.locale)
              : p.t("free")}{" "}
            · {p.t(categoryLabel(p.booking.tariffCategory))}
          </li>
        )}
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
