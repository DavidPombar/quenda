// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useGetFacilityQuery } from "@/queries/facilities/get-facility.query";
import { useGetAvailabilityQuery } from "@/queries/facilities/get-availability.query";
import { useCreateBookingMutation } from "@/queries/bookings/create-booking.mutation";
import { useGetTariffQuery } from "@/queries/categories/get-tariff.query";
import { useListWaitlistQuery } from "@/queries/waitlist/list-waitlist.query";
import { useListBookingsQuery } from "@/queries/bookings/list-bookings.query";
import { offeredPrices } from "@/services/tariff.service";
import { today, timeLabel, longDayLabel } from "@/services/date.service";
import { localized } from "@/services/catalog.service";
import { fill } from "@/services/i18n.service";
import { orderResources, resourceLabel } from "@/services/resources.service";
import type { AppContext } from "@/types/app-context";
import { ROUTES, routeFor } from "@/constants/routes";
import type { Resource, Slot, SlotSuggestion } from "@/types/models";
/** Value of the court selector that shows every court in one table. */
const ALL_RESOURCES = "all";
export function useFacilityDetailsController() {
  const context = useOutletContext<AppContext>();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const facilities = useGetFacilityQuery({
    slug: context.municipality.slug,
    id,
  });
  const facility = facilities.data;
  const firstDay = today(context.municipality.timezone);
  const dateOptions = Array.from(
    { length: context.municipality.advanceDays + 1 },
    (_, i) => Temporal.PlainDate.from(firstDay).add({ days: i }).toString(),
  );
  // An alternative in another facility opens it on the same day (`?data=`).
  const requested = params.get("data") ?? "";
  const [date, setDate] = useState(
    dateOptions.includes(requested) ? requested : firstDay,
  );
  const [selected, setSelected] = useState<{
    slot: Slot;
    resource: Resource | null;
  } | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [chosenView, setChosenView] = useState("");
  const [waiting, setWaiting] = useState<{
    slot: Slot;
    resource: Resource | null;
  } | null>(null);
  const waitlist = useListWaitlistQuery(context.session?.userId);
  const mine = useListBookingsQuery(context.session?.userId);
  const availability = useGetAvailabilityQuery({
    slug: context.municipality.slug,
    id,
    date,
    // Closed or in maintenance: the page explains it instead of offering slots.
    enabled: facility?.status === "active",
  });
  const create = useCreateBookingMutation();
  const tariff = useGetTariffQuery({
    facilityId: facility ? id : "",
    userId: context.session?.userId,
  });
  const prices = facility ? offeredPrices(facility, context.municipality) : [];
  const resources = orderResources(facility?.resources ?? []);
  const activeResources = resources.filter((resource) => resource.active);
  // Several courts: the person picks one; a single court keeps today's UI.
  const multiple = activeResources.length > 1;
  const showResource = resources.length > 1;
  const view =
    multiple &&
    (chosenView === ALL_RESOURCES ||
      activeResources.some((resource) => resource.id === chosenView))
      ? chosenView
      : (activeResources[0]?.id ?? "");
  const grid = multiple && view === ALL_RESOURCES;
  const currentResource =
    activeResources.find((resource) => resource.id === view) ?? null;
  const availabilityById = new Map(
    (availability.data?.resources ?? []).map((item) => [item.id, item]),
  );
  const resourceOptions = activeResources.map((resource) => ({
    value: resource.id,
    label: resourceLabel(resource, resources),
  }));
  function select(slot: Slot, resource: Resource | null) {
    context.track("slot-open");
    setSelected({ slot, resource });
    setRequestId(crypto.randomUUID());
    create.reset();
  }
  // A booked slot can be waited for when the council has a waiting list (#96); club slots cannot.
  const waitlistOn = context.municipality.waitlistMaxEntries > 0;
  // Nobody waits for a slot they already hold.
  const own = (slot: Slot, resource: Resource | null) =>
    (mine.data ?? []).some(
      (booking) =>
        booking.facilityId === id &&
        booking.status === "confirmed" &&
        booking.start === slot.start &&
        (!resource || booking.resourceId === resource.id),
    );
  const canWait = (slot: Slot, resource: Resource | null) =>
    waitlistOn && slot.status === "booked" && !own(slot, resource);
  const entryFor = (slot: Slot, resource: Resource | null) =>
    (waitlist.data ?? []).find(
      (entry) =>
        entry.facilityId === id &&
        entry.start === slot.start &&
        (!resource || entry.resourceId === resource.id),
    ) ?? null;
  /** Second line of a slot that can be waited for: on the list already, or the list itself. */
  const waitNote = (slot: Slot, resource: Resource | null) =>
    !canWait(slot, resource)
      ? null
      : context.t(
          entryFor(slot, resource) ? "waitlistOnList" : "waitlistShort",
        );
  function choose(slot: Slot, resource: Resource | null) {
    if (slot.status === "available") select(slot, resource);
    else if (canWait(slot, resource)) setWaiting({ slot, resource });
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
      create.mutate(
        {
          id: requestId,
          facilityId: id,
          start: selected.slot.start,
          ...(showResource && selected.resource
            ? { resourceId: selected.resource.id }
            : {}),
        },
        { onSuccess: () => context.track("booking-confirmed") },
      );
  }
  const days = dateOptions.slice(0, 7);
  const slots = currentResource
    ? (availabilityById.get(currentResource.id)?.slots ?? [])
    : [];
  // Grid columns: every start time offered by any court of the facility.
  const columnsByStart = new Map<string, Slot>();
  for (const resource of activeResources)
    for (const slot of availabilityById.get(resource.id)?.slots ?? [])
      if (!columnsByStart.has(slot.start)) columnsByStart.set(slot.start, slot);
  const columns = [...columnsByStart.values()].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const timeline = grid ? columns : slots;
  // Announced when the day or the court changes (WCAG 4.1.3), since the grid redraws silently.
  const freeCount = (
    grid
      ? activeResources.flatMap(
          (resource) => availabilityById.get(resource.id)?.slots ?? [],
        )
      : slots
  ).filter((slot) => slot.status === "available").length;
  const pastCount = timeline.filter((slot) => slot.status === "past").length;
  const visibleSlots = showPast
    ? slots
    : slots.filter((slot) => slot.status !== "past");
  const visibleColumns = (
    showPast ? columns : columns.filter((slot) => slot.status !== "past")
  ).map((slot) => ({
    start: slot.start,
    label: timeLabel(slot.start, context.municipality.timezone),
  }));
  // A shared lane or room (#95) says how many places are left, in text and not only by colour.
  const slotText = (slot: Slot) =>
    slot.capacity === undefined
      ? context.t(slot.status === "available" ? "slotFree" : slot.status)
      : slot.status === "available"
        ? fill(context.t("placesLeft"), {
            remaining: slot.remaining ?? 0,
            capacity: slot.capacity,
          })
        : context.t(slot.status === "booked" ? "placesFull" : slot.status);
  /** Second line of a free slot of a shared court: «3 de 6 prazas». */
  const slotPlaces = (slot: Slot) =>
    slot.capacity !== undefined && slot.status === "available"
      ? fill(context.t("placesCount"), {
          remaining: slot.remaining ?? 0,
          capacity: slot.capacity,
        })
      : null;
  const rows = resources.map((resource) => {
    const byStart = new Map(
      (availabilityById.get(resource.id)?.slots ?? []).map((slot) => [
        slot.start,
        slot,
      ]),
    );
    return {
      id: resource.id,
      name: resource.name,
      parentName: resource.parentId
        ? resources.find((item) => item.id === resource.parentId)?.name
        : undefined,
      active: resource.active,
      cells: visibleColumns.map((column) => {
        const slot = byStart.get(column.start);
        const note = slot ? waitNote(slot, resource) : null;
        const status = slot
          ? `${slotText(slot)}${note ? `, ${note}` : ""}`
          : "";
        return {
          start: column.start,
          slot,
          // The narrow grid cell shows the short count; its label reads it in full.
          status:
            slot?.capacity !== undefined && slot.status === "available"
              ? fill(context.t("placesShort"), {
                  remaining: slot.remaining ?? 0,
                  capacity: slot.capacity,
                })
              : status,
          label: context
            .t("slotWithResource")
            .replace("{time}", column.label)
            .replace("{resource}", resource.name)
            .replace("{status}", status),
          open:
            !!slot && (slot.status === "available" || canWait(slot, resource)),
          select: () => {
            if (slot) choose(slot, resource);
          },
        };
      }),
    };
  });
  // No free court that day, or the chosen slot was taken meanwhile: offer alternatives (#25).
  const dayFull =
    !!availability.data &&
    !availability.data.resources.some((item) =>
      item.slots.some((slot) => slot.status === "available"),
    );
  const taken =
    (create.error as { code?: string } | null)?.code === "slot_taken";
  function pick(suggestion: SlotSuggestion) {
    context.track("suggestion-picked");
    if (!suggestion.sameFacility) {
      close();
      void navigate(
        `${routeFor(context.municipality.slug, ROUTES.detail.replace(":id", suggestion.facilityId))}?data=${date}`,
      );
      return;
    }
    const resource =
      resources.find((item) => item.id === suggestion.resourceId) ?? null;
    if (resource && multiple && !grid) setChosenView(resource.id);
    select(
      { start: suggestion.start, end: suggestion.end, status: "available" },
      resource,
    );
  }
  function changeDate(value: string) {
    setDate(value);
    setShowPast(false);
  }
  function changeView(value: string) {
    setChosenView(value);
    setShowPast(false);
  }
  const openingDays = (facility?.openingWeek ?? []).map((day) => ({
    date: day.date,
    label: longDayLabel(day.date, context.locale),
    closed: !day.hours.length,
    hours: day.holiday
      ? context.t("holidayClosed")
      : day.hours.length
        ? day.hours.map((hours) => `${hours.from}–${hours.to}`).join(", ")
        : context.t("closedDay"),
  }));
  return {
    slotsSummary: availability.isSuccess
      ? fill(context.t("slotsSummary"), {
          day: longDayLabel(date, context.locale),
          count: freeCount,
        })
      : "",
    ...context,
    facilities,
    facility,
    sportName: facility ? localized(facility.sportName, context.locale) : "",
    photos: (facility?.photos ?? []).map((photo) => ({
      id: photo.id,
      url: photo.url,
      alt: localized(photo.alt, context.locale),
    })),
    openingDays,
    showPhotoLabel: (index: number, alt: string) =>
      context
        .t("showPhoto")
        .replace("{n}", String(index))
        .replace("{alt}", alt),
    availability,
    date,
    setDate: changeDate,
    days,
    dateOptions,
    multiple,
    view,
    setView: changeView,
    allResourcesValue: ALL_RESOURCES,
    grid,
    resourceOptions,
    currentResource,
    slots,
    visibleSlots,
    visibleColumns,
    rows,
    slotText,
    slotPlaces,
    pastCount,
    showPast,
    togglePast: () => setShowPast((value) => !value),
    selected: selected?.slot ?? null,
    selectedResource:
      showResource && selected?.resource
        ? resourceLabel(selected.resource, resources)
        : "",
    select: (slot: Slot) => choose(slot, currentResource),
    canOpen: (slot: Slot) =>
      slot.status === "available" || canWait(slot, currentResource),
    waitNote: (slot: Slot) => waitNote(slot, currentResource),
    waiting: waiting && {
      ...waiting,
      // The court is sent only when the facility has several, as for bookings.
      resourceId: showResource && waiting.resource ? waiting.resource.id : null,
      resourceName:
        showResource && waiting.resource
          ? resourceLabel(waiting.resource, resources)
          : "",
      entry: entryFor(waiting.slot, waiting.resource),
    },
    closeWaiting: () => setWaiting(null),
    close,
    reserve,
    create,
    dayFull,
    taken,
    takenStart: taken ? (selected?.slot.start ?? null) : null,
    pick,
    tariff: tariff.data ?? null,
    prices,
  };
}
