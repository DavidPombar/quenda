// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useCreateBookingMutation } from "@/queries/bookings/create-booking.mutation";
import { timeLabel } from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { WaitlistEntry } from "@/types/models";
/**
 * Confirms the place a waiting-list offer holds (#96): a normal booking that takes the held
 * place, so the person's rules and tariff apply now.
 */
export function useAcceptOfferDialogController(p: {
  entry: WaitlistEntry;
  context: AppContext;
}) {
  const create = useCreateBookingMutation();
  const [requestId] = useState(() => crypto.randomUUID());
  return {
    create,
    deadline: fill(p.context.t("acceptOfferBody"), {
      time: timeLabel(
        p.entry.offerExpiresAt ?? "",
        p.context.municipality.timezone,
      ),
    }),
    confirm: () => {
      create.mutate(
        {
          id: requestId,
          facilityId: p.entry.facilityId,
          resourceId: p.entry.resourceId,
          start: p.entry.start,
          waitlistEntryId: p.entry.id,
        },
        { onSuccess: () => p.context.track("booking-confirmed") },
      );
    },
  };
}
