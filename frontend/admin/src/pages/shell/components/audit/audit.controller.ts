// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  isForbiddenError,
  useListAuditQuery,
} from "@/queries/audit/list-audit.query";
import {
  dateTimeLabel,
  dayEndInstant,
  dayStartInstant,
  isPlainDate,
} from "@/services/date.service";
import type { TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { AuditEvent, AuditFilters } from "@/types/models";
const AUDIT_ACTIONS = [
  ["booking.created", "auditBookingCreated"],
  ["booking.rescheduled", "auditBookingRescheduled"],
  ["booking.cancelled", "auditBookingCancelled"],
  ["booking.cancelled_by_municipality", "auditBookingCancelledByMunicipality"],
  ["booking.no_show", "auditBookingNoShow"],
  ["booking.attendance_corrected", "auditAttendanceCorrected"],
  ["booking.checked_in", "auditBookingCheckedIn"],
  ["user.blocked", "auditUserBlocked"],
  ["user.unblocked", "auditUserUnblocked"],
  ["facility.created", "auditFacilityCreated"],
  ["facility.updated", "auditFacilityUpdated"],
  ["account.exported", "auditAccountExported"],
  ["account.deleted", "auditAccountDeleted"],
  ["consent.accepted", "auditConsentAccepted"],
  ["retention.applied", "auditRetentionApplied"],
  ["municipality.updated", "auditMunicipalityUpdated"],
  ["municipality.logo_updated", "auditLogoUpdated"],
  ["municipality.logo_deleted", "auditLogoDeleted"],
  ["access_key.rotated", "auditAccessKeyRotated"],
  ["access_webhook.updated", "auditAccessWebhookUpdated"],
  ["notification_preferences.updated", "auditPreferencesUpdated"],
  ["notification_preferences.unsubscribed", "auditPreferencesUnsubscribed"],
  ["push_device.added", "auditPushDeviceAdded"],
  ["push_device.removed", "auditPushDeviceRemoved"],
  ["category.requested", "auditCategoryRequested"],
  ["category.verified", "auditCategoryVerified"],
  ["category.rejected", "auditCategoryRejected"],
  ["category.assigned", "auditCategoryAssigned"],
  ["category.revoked", "auditCategoryRevoked"],
  ["organization.created", "auditOrganizationCreated"],
  ["organization.updated", "auditOrganizationUpdated"],
  ["organization.representative_added", "auditRepresentativeAdded"],
  ["organization.representative_removed", "auditRepresentativeRemoved"],
  ["season_campaign.created", "auditCampaignCreated"],
  ["season_campaign.updated", "auditCampaignUpdated"],
  ["season_allocation.created", "auditAllocationCreated"],
  ["sport.created", "auditSportCreated"],
  ["sport.updated", "auditSportUpdated"],
  ["facility.photo_added", "auditPhotoAdded"],
  ["facility.photo_updated", "auditPhotoUpdated"],
  ["facility.photo_removed", "auditPhotoRemoved"],
  ["season_allocation.cancelled", "auditAllocationCancelled"],
  ["season_occurrence.cancelled", "auditOccurrenceCancelled"],
] as const satisfies readonly (readonly [string, TextKey])[];
const ACTION_LABELS = new Map<string, TextKey>(AUDIT_ACTIONS);
const ROLE_LABELS = {
  citizen: "auditRoleCitizen",
  manager: "auditRoleManager",
  access: "auditRoleAccess",
  system: "auditRoleSystem",
} as const satisfies Record<string, TextKey>;
export function useAuditController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const isManager = context.session?.role === "manager";
  const knownAction = ACTION_LABELS.has(params.get("action") ?? "");
  const action = knownAction ? (params.get("action") ?? "") : "";
  const from = isPlainDate(params.get("from") ?? "")
    ? (params.get("from") ?? "")
    : "";
  const to = isPlainDate(params.get("to") ?? "")
    ? (params.get("to") ?? "")
    : "";
  const rangeInvalid = !!from && !!to && from > to;
  const timezone = context.municipality.timezone;
  const filters: AuditFilters = {
    ...(action && { action }),
    ...(from && { from: dayStartInstant(from, timezone) }),
    ...(to && { to: dayEndInstant(to, timezone) }),
  };
  const events = useListAuditQuery(
    isManager && !rangeInvalid ? context.municipality.id : undefined,
    filters,
  );
  function setFilter(key: "action" | "from" | "to", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true });
  }
  const t = context.t;
  const actionLabel = (event: AuditEvent) => {
    const key = ACTION_LABELS.get(event.action);
    return key ? t(key) : event.action;
  };
  const actorLabel = (event: AuditEvent) =>
    event.actorName ??
    (event.actorRole === "system"
      ? t("auditSystem")
      : t("auditDeletedAccount"));
  const roleLabel = (event: AuditEvent) =>
    event.actorRole ? t(ROLE_LABELS[event.actorRole]) : "";
  const shortId = (id: string) => (id.length > 8 ? `${id.slice(0, 8)}…` : id);
  const occurredAt = (event: AuditEvent) =>
    dateTimeLabel(event.occurredAt, timezone, context.locale);
  const formatDetails = (details: Record<string, unknown>) =>
    JSON.stringify(details, null, 2);
  return {
    ...context,
    isManager,
    events,
    forbidden: isForbiddenError(events.error),
    hasFilters: !!(action || from || to),
    action,
    from,
    to,
    rangeInvalid,
    setFilter,
    clearFilters,
    actions: AUDIT_ACTIONS,
    actionLabel,
    actorLabel,
    roleLabel,
    shortId,
    occurredAt,
    formatDetails,
  };
}
