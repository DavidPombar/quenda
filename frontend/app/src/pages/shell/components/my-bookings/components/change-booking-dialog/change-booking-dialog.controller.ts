// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useGetAvailabilityQuery } from "@/queries/facilities/get-availability.query";
import { useUpdateBookingMutation } from "@/queries/bookings/update-booking.mutation";
import { today } from "@/services/date.service";
import {
  orderResources,
  distinctResource,
  resourceLabel,
} from "@/services/resources.service";
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
  const [chosenResource, setChosenResource] = useState("");
  const update = useUpdateBookingMutation();
  const facilities = useListFacilitiesQuery(args.context.municipality.slug);
  const facility = facilities.data?.find(
    (item) => item.id === args.booking.facilityId,
  );
  const resources = orderResources(facility?.resources ?? []);
  const activeResources = resources.filter((resource) => resource.active);
  // Courts of the same facility; the current one is preselected.
  const resourceId =
    chosenResource ||
    (activeResources.some((item) => item.id === args.booking.resourceId) ||
    !activeResources.length
      ? args.booking.resourceId
      : activeResources[0].id);
  const query = useGetAvailabilityQuery({
    slug: args.context.municipality.slug,
    id: args.booking.facilityId,
    date,
  });
  const slots =
    query.data?.resources.find((item) => item.id === resourceId)?.slots ?? [];
  const freeSlots = slots.filter((slot) => slot.status === "available");
  async function confirm() {
    if (!selected) return;
    try {
      // resourceId travels only when the person moves to another court.
      await update.mutateAsync({
        id: args.booking.id,
        start: selected,
        ...(resourceId !== args.booking.resourceId ? { resourceId } : {}),
      });
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
  function changeResource(value: string) {
    setChosenResource(value);
    setSelected("");
  }
  const firstDay = today(args.context.municipality.timezone);
  const dateOptions = Array.from(
    { length: args.context.municipality.advanceDays + 1 },
    (_, i) => Temporal.PlainDate.from(firstDay).add({ days: i }).toString(),
  );
  return {
    resourceName: distinctResource(
      args.booking.facilityName,
      args.booking.resourceName,
    ),
    date,
    changeDate,
    multiple: activeResources.length > 1,
    resourceId,
    changeResource,
    resourceOptions: activeResources.map((resource) => ({
      value: resource.id,
      label: resourceLabel(resource, resources),
    })),
    query,
    freeSlots,
    selected,
    setSelected,
    update,
    confirm,
    dateOptions,
  };
}
