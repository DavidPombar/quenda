// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { useListAllocationsQuery } from "@/queries/seasons/list-allocations.query";
import { useAssignSlotMutation } from "@/queries/seasons/assign-slot.mutation";
import { useCancelAllocationMutation } from "@/queries/seasons/cancel-allocation.mutation";
import { useCancelDateMutation } from "@/queries/seasons/cancel-date.mutation";
import type {
  Campaign,
  Facility,
  Organization,
  SeasonAllocation,
  SeasonAssignment,
} from "@/types/models";
export function useScheduleController(p: {
  campaign: Campaign;
  organizations: Organization[];
  facilities: Facility[];
}) {
  const allocations = useListAllocationsQuery(p.campaign.id);
  const assign = useAssignSlotMutation();
  const withdraw = useCancelAllocationMutation();
  const free = useCancelDateMutation();
  const facilities = p.facilities.filter((item) =>
    p.campaign.facilityIds.includes(item.id),
  );
  const clubs = p.organizations.filter((item) => !item.archivedAt);
  const [organizationId, setOrganizationId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startsLocal, setStartsLocal] = useState("19:00");
  const [endsLocal, setEndsLocal] = useState("21:00");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<SeasonAssignment | null>(null);
  const [dialog, setDialog] = useState<{
    kind: "withdraw" | "date";
    allocation: SeasonAllocation;
  } | null>(null);
  const facility =
    facilities.find((item) => item.id === facilityId) ?? facilities[0];
  const resources = (facility?.resources ?? []).filter((item) => item.active);
  const resource =
    resources.find((item) => item.id === resourceId)?.id ??
    resources[0]?.id ??
    facility?.id ??
    "";
  const club = clubs.find((item) => item.id === organizationId) ?? clubs[0];
  async function submit(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    if (!club || !facility || !weekdays.length || !reason.trim()) return;
    try {
      setResult(
        await assign.mutateAsync({
          campaignId: p.campaign.id,
          organizationId: club.id,
          facilityId: facility.id,
          resourceId: resource,
          weekdays: [...weekdays].sort(),
          startsLocal,
          endsLocal,
          reason: reason.trim(),
        }),
      );
      setReason("");
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function confirm(text: string, dateId: string) {
    if (!dialog) return;
    try {
      if (dialog.kind === "withdraw")
        await withdraw.mutateAsync({ id: dialog.allocation.id, reason: text });
      else await free.mutateAsync({ id: dateId, reason: text });
      setDialog(null);
    } catch {
      /* The dialog shows the error. */
    }
  }
  return {
    allocations,
    clubs,
    club: club?.id ?? "",
    setOrganizationId,
    facilities,
    facility: facility?.id ?? "",
    setFacilityId: (id: string) => {
      setFacilityId(id);
      setResourceId("");
    },
    resources,
    resource,
    setResourceId,
    weekdays,
    toggleWeekday: (day: number) =>
      setWeekdays((current) =>
        current.includes(day)
          ? current.filter((value) => value !== day)
          : [...current, day],
      ),
    startsLocal,
    setStartsLocal,
    endsLocal,
    setEndsLocal,
    reason,
    setReason,
    assign,
    result,
    submit,
    dialog,
    open: (kind: "withdraw" | "date", allocation: SeasonAllocation) => {
      withdraw.reset();
      free.reset();
      setDialog({ kind, allocation });
    },
    close: () => setDialog(null),
    confirm,
    pending: withdraw.isPending || free.isPending,
    failed: withdraw.isError || free.isError,
  };
}
