// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useGetAvailabilityQuery } from "@/queries/facilities/get-availability.query";
import { useCreateBookingMutation } from "@/queries/bookings/create-booking.mutation";
import { today } from "@/services/date.service";
import type { AppContext } from "@/types/app-context";
import type { Slot } from "@/types/models";
export function useFacilityDetailsController() {
  const context = useOutletContext<AppContext>();
  const { id = "" } = useParams();
  const facilities = useListFacilitiesQuery(context.municipality.slug);
  const facility = facilities.data?.find((item) => item.id === id);
  const firstDay = today(context.municipality.timezone);
  const [date, setDate] = useState(firstDay);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [requestId, setRequestId] = useState("");
  const availability = useGetAvailabilityQuery({
    slug: context.municipality.slug,
    id,
    date,
  });
  const create = useCreateBookingMutation();
  function select(slot: Slot) {
    setSelected(slot);
    setRequestId(crypto.randomUUID());
    create.reset();
  }
  function close() {
    setSelected(null);
    create.reset();
  }
  function reserve() {
    if (!context.session) {
      context.signIn();
      return;
    }
    if (selected)
      create.mutate({ id: requestId, facilityId: id, start: selected.start });
  }
  const dateOptions = Array.from(
    { length: context.municipality.advanceDays + 1 },
    (_, i) => Temporal.PlainDate.from(firstDay).add({ days: i }).toString(),
  );
  const days = dateOptions.slice(0, 7);
  const slots = availability.data ?? [];
  const pastCount = slots.filter((slot) => slot.status === "past").length;
  const visibleSlots = showPast
    ? slots
    : slots.filter((slot) => slot.status !== "past");
  function changeDate(value: string) {
    setDate(value);
    setShowPast(false);
  }
  return {
    ...context,
    facilities,
    facility,
    availability,
    date,
    setDate: changeDate,
    days,
    dateOptions,
    slots,
    visibleSlots,
    pastCount,
    showPast,
    togglePast: () => setShowPast((value) => !value),
    selected,
    select,
    close,
    reserve,
    create,
  };
}
