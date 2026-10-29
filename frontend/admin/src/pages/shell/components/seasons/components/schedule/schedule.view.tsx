// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { dateLabel, timeLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type {
  Campaign,
  Facility,
  Locale,
  Organization,
  SeasonAllocation,
} from "@/types/models";
import { ReasonDialog } from "./components/reason-dialog/reason-dialog.view";
import { useScheduleController } from "./schedule.controller";
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const dayKey = (day: number) => `weekday${day}` as TextKey;
export function Schedule(p: {
  campaign: Campaign;
  organizations: Organization[];
  facilities: Facility[];
  t: (key: TextKey) => string;
  locale: Locale;
  timezone: string;
}) {
  const c = useScheduleController(p);
  const { t } = p;
  const when = (start: string, end: string) =>
    `${dateLabel(start, p.timezone, p.locale)} ${timeLabel(start, p.timezone)}–${timeLabel(end, p.timezone)}`;
  const describe = (allocation: SeasonAllocation) =>
    `${allocation.organizationName} · ${allocation.facilityName} · ${allocation.resourceName} · ${allocation.weekdays
      .map((day) => t(dayKey(day)))
      .join(", ")} ${allocation.startsLocal}–${allocation.endsLocal}`;
  return (
    <section className="settings-section" aria-labelledby="schedule-title">
      <h2 id="schedule-title">
        {t("schedule")}: {p.campaign.name}
      </h2>
      {c.allocations.isPending ? (
        <Feedback message={t("loading")} />
      ) : c.allocations.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.allocations.refetch();
          }}
        />
      ) : c.allocations.data.length === 0 ? (
        <p className="muted">{t("scheduleEmpty")}</p>
      ) : (
        <ul className="season-list">
          {c.allocations.data.map((allocation) => (
            <li key={allocation.id} className="season-card">
              <strong>{describe(allocation)}</strong>
              <span className="muted">
                {allocation.cancelledAt
                  ? fill(t("slotCancelled"), {
                      reason: allocation.cancellationReason ?? "",
                    })
                  : fill(t("slotDates"), {
                      active: allocation.active,
                      cancelled: allocation.cancelled,
                    })}
              </span>
              {allocation.conflicts.length > 0 && (
                <>
                  <span>{t("slotConflicts")}</span>
                  <ul className="conflict-list">
                    {allocation.conflicts.map((conflict) => (
                      <li key={conflict.occurrenceId}>
                        {when(conflict.start, conflict.end)} ·{" "}
                        {t(
                          conflict.bookingId
                            ? "slotConflictBooking"
                            : "slotConflictClub",
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {!allocation.cancelledAt && (
                <div className="row-actions">
                  {allocation.dates.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => c.open("date", allocation)}
                    >
                      {t("slotFreeDate")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => c.open("withdraw", allocation)}
                  >
                    {t("slotWithdraw")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="form-grid settings-grid"
        aria-label={t("slotAssign")}
        onSubmit={(event) => {
          void c.submit(event);
        }}
      >
        <Field.Root className="field">
          <Field.Label>{t("slotClub")}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={c.club}
              onChange={(event) => c.setOrganizationId(event.target.value)}
            >
              {c.clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("slotFacility")}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={c.facility}
              onChange={(event) => c.setFacilityId(event.target.value)}
            >
              {c.facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        {c.resources.length > 1 && (
          <Field.Root className="field">
            <Field.Label>{t("slotCourt")}</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={c.resource}
                onChange={(event) => c.setResourceId(event.target.value)}
              >
                {c.resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        )}
        <fieldset className="full checkbox-group">
          <legend>{t("slotDays")}</legend>
          {DAYS.map((day) => (
            <label key={day} className="checkbox-field">
              <input
                type="checkbox"
                checked={c.weekdays.includes(day)}
                onChange={() => c.toggleWeekday(day)}
              />
              {t(dayKey(day))}
            </label>
          ))}
        </fieldset>
        <Field.Root className="field">
          <Field.Label>{t("slotStart")}</Field.Label>
          <Input
            type="time"
            value={c.startsLocal}
            onChange={(event) => c.setStartsLocal(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("slotEnd")}</Field.Label>
          <Input
            type="time"
            value={c.endsLocal}
            onChange={(event) => c.setEndsLocal(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field full" required>
          <Field.Label>
            {t("slotReason")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={c.reason}
            onChange={(event) => c.setReason(event.target.value)}
          />
        </Field.Root>
        <div className="full">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.assign.isPending}
            disabled={!c.clubs.length || !c.weekdays.length || !c.reason.trim()}
          >
            {t("slotAssign")}
          </Button>
        </div>
      </form>
      <div role="status">
        {c.result && (
          <div className="season-card">
            <strong>
              {fill(t("slotSummary"), {
                created: c.result.created,
                conflicts: c.result.conflicts.length,
              })}
            </strong>
            {c.result.conflicts.length > 0 && (
              <>
                <span>{t("slotConflicts")}</span>
                <ul className="conflict-list">
                  {c.result.conflicts.map((conflict) => (
                    <li key={conflict.occurrenceId}>
                      {when(conflict.start, conflict.end)} ·{" "}
                      {t(
                        conflict.bookingId
                          ? "slotConflictBooking"
                          : "slotConflictClub",
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
      {c.assign.isError && (
        <p role="alert" className="error-text">
          {t("seasonError")}
        </p>
      )}
      {c.dialog && (
        <ReasonDialog
          title={t(
            c.dialog.kind === "withdraw"
              ? "slotWithdrawTitle"
              : "slotFreeTitle",
          )}
          description={describe(c.dialog.allocation)}
          dates={
            c.dialog.kind === "date"
              ? c.dialog.allocation.dates.map((date) => ({
                  id: date.id,
                  label: when(date.start, date.end),
                }))
              : undefined
          }
          t={t}
          pending={c.pending}
          error={c.failed}
          onConfirm={(reason, dateId) => {
            void c.confirm(reason, dateId);
          }}
          onClose={c.close}
        />
      )}
    </section>
  );
}
