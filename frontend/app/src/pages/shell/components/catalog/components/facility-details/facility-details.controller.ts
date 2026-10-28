// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useGetAvailabilityQuery } from "@/queries/facilities/get-availability.query";
import { useCreateBookingMutation } from "@/queries/bookings/create-booking.mutation";
import { today, timeLabel } from "@/services/date.service";
import { orderResources, resourceLabel } from "@/services/resources.service";
import type { AppContext } from "@/types/app-context";
import type { Resource, Slot } from "@/types/models";
/** Value of the court selector that shows every court in one table. */
const ALL_RESOURCES = "all";
export function useFacilityDetailsController() {
  const context = useOutletContext<AppContext>();
  const { id = "" } = useParams();
  const facilities = useListFacilitiesQuery(context.municipality.slug);
  const facility = facilities.data?.find((item) => item.id === id);
  const firstDay = today(context.municipality.timezone);
  const [date, setDate] = useState(firstDay);
  const [selected, setSelected] = useState<{
    slot: Slot;
    resource: Resource | null;
  } | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [chosenView, setChosenView] = useState("");
  const availability = useGetAvailabilityQuery({
    slug: context.municipality.slug,
    id,
    date,
  });
  const create = useCreateBookingMutation();
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
    setSelected({ slot, resource });
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
      create.mutate({
        id: requestId,
        facilityId: id,
        start: selected.slot.start,
        ...(showResource && selected.resource
          ? { resourceId: selected.resource.id }
          : {}),
      });
  }
  const dateOptions = Array.from(
    { length: context.municipality.advanceDays + 1 },
    (_, i) => Temporal.PlainDate.from(firstDay).add({ days: i }).toString(),
  );
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
        const status = slot
          ? context.t(slot.status === "available" ? "slotFree" : slot.status)
          : "";
        return {
          start: column.start,
          slot,
          status,
          label: context
            .t("slotWithResource")
            .replace("{time}", column.label)
            .replace("{resource}", resource.name)
            .replace("{status}", status),
          select: () => {
            if (slot) select(slot, resource);
          },
        };
      }),
    };
  });
  function changeDate(value: string) {
    setDate(value);
    setShowPast(false);
  }
  function changeView(value: string) {
    setChosenView(value);
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
    pastCount,
    showPast,
    togglePast: () => setShowPast((value) => !value),
    selected: selected?.slot ?? null,
    selectedResource:
      showResource && selected?.resource
        ? resourceLabel(selected.resource, resources)
        : "",
    select: (slot: Slot) => select(slot, currentResource),
    close,
    reserve,
    create,
  };
}
