// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useGetAvailabilityQuery } from "@/queries/facilities/get-availability.query";
import { useUpdateBookingMutation } from "@/queries/bookings/update-booking.mutation";
import { today } from "@/services/date.service";
import type { Booking } from "@/types/models";
import type { AppContext } from "@/types/app-context";
export function useChangeBookingDialogController(args: {
  booking: Booking;
  context: AppContext;
  onClose: () => void;
}) {
  const [date, setDate] = useState(
    Temporal.Instant.from(args.booking.start)
      .toZonedDateTimeISO(args.context.municipality.timezone)
      .toPlainDate()
      .toString(),
  );
  const [selected, setSelected] = useState("");
  const update = useUpdateBookingMutation();
  const query = useGetAvailabilityQuery({
    slug: args.context.municipality.slug,
    id: args.booking.facilityId,
    date,
  });
  async function confirm() {
    if (!selected) return;
    try {
      await update.mutateAsync({ id: args.booking.id, start: selected });
      args.onClose();
    } catch {
      /* Mutation state presents the error. */
    }
  }
  function changeDate(value: string) {
    if (value) {
      setDate(value);
      setSelected("");
    }
  }
  const firstDay = today(args.context.municipality.timezone);
  const dateOptions = Array.from(
    { length: args.context.municipality.advanceDays + 1 },
    (_, i) => Temporal.PlainDate.from(firstDay).add({ days: i }).toString(),
  );
  return {
    date,
    changeDate,
    query,
    selected,
    setSelected,
    update,
    confirm,
    dateOptions,
  };
}
