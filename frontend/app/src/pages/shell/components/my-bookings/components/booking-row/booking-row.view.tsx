// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiCheck,
  PiTag,
  PiClock,
  PiQrCode,
  PiSquareHalf,
  PiUserMinus,
  PiCalendarPlus,
  PiX,
} from "react-icons/pi";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { bookingDayLabel, money, timeLabel } from "@/services/date.service";
import { distinctResource } from "@/services/resources.service";
import { categoryLabel } from "@/services/tariff.service";
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
  sportLabel: string;
  canChange: boolean;
  calendarHref: string;
  onCancel: () => void;
  onChange: () => void;
  canShowPass: boolean;
  onShowPass: () => void;
}) {
  const resource = distinctResource(
    p.booking.facilityName,
    p.booking.resourceName,
  );
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
        {resource && (
          <li>
            <PiSquareHalf size={20} aria-hidden="true" />
            <span className="sr-only">{p.t("resource")}: </span>
            {resource}
          </li>
        )}
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
          <SportTag sport={p.booking.sport} label={p.sportLabel} />
        </li>
      </ul>
      {p.booking.status === "confirmed" && (
        <div className="booking-actions">
          {p.canShowPass && (
            <Button size="lg" colorPalette="court" onClick={p.onShowPass}>
              <PiQrCode size={20} aria-hidden="true" />
              {p.t("showPass")}
            </Button>
          )}
          {p.canChange && (
            <>
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
            </>
          )}
          <Button asChild size="lg" variant="ghost">
            <a href={p.calendarHref} download>
              <PiCalendarPlus size={20} aria-hidden="true" />
              {p.t("addToCalendar")}
            </a>
          </Button>
        </div>
      )}
    </article>
  );
}
