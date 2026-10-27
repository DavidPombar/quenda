// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useGetAccessPassQuery } from "@/queries/bookings/get-access-pass.query";
import { longDayLabel, timeLabel } from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import { qrPath } from "@/services/qr.service";
import type { AppContext } from "@/types/app-context";
import type { Booking } from "@/types/models";
export function useAccessPassDialogController(p: {
  booking: Booking;
  context: AppContext;
}) {
  const { t, municipality, locale } = p.context;
  const query = useGetAccessPassQuery(p.booking.id);
  const pass = query.data;
  const qr = useMemo(() => (pass ? qrPath(pass.token) : null), [pass]);
  const zone = municipality.timezone;
  return {
    query,
    pass,
    qr,
    imageLabel: fill(t("passImage"), { facility: p.booking.facilityName }),
    validity: pass
      ? fill(t("passValid"), {
          day: longDayLabel(
            Temporal.Instant.from(pass.validFrom)
              .toZonedDateTimeISO(zone)
              .toPlainDate()
              .toString(),
            locale,
          ),
          from: timeLabel(pass.validFrom, zone),
          until: timeLabel(pass.validUntil, zone),
        })
      : "",
  };
}
