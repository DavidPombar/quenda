// SPDX-License-Identifier: AGPL-3.0-or-later
import { useGetCredentialQuery } from "@/queries/bookings/get-credential.query";
import { qrPath } from "@/services/qr.service";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { Booking } from "@/types/models";
export function useAccessPassDialogController(p: {
  booking: Booking;
  context: AppContext;
}) {
  const query = useGetCredentialQuery(p.booking.id);
  const { municipality, locale, t } = p.context;
  const credential = query.data;
  return {
    query,
    code: credential ? qrPath(credential.token) : null,
    validity: credential
      ? fill(t("accessPassValidity"), {
          day: bookingDayLabel(
            credential.notBefore,
            municipality.timezone,
            locale,
          ),
          from: timeLabel(credential.notBefore, municipality.timezone),
          until: timeLabel(credential.expiresAt, municipality.timezone),
        })
      : "",
  };
}
