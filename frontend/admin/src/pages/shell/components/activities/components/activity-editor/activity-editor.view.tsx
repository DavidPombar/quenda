// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect, Textarea } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { fullDateLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import { categoryLabel } from "@/services/tariff.service";
import type {
  Facility,
  Locale,
  ManagedActivity,
  Municipality,
  SportInfo,
} from "@/types/models";
import { ActivityClashes } from "./components/activity-clashes/activity-clashes.view";
import { useActivityEditorController } from "./activity-editor.controller";
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const dayKey = (day: number) => `weekday${day}` as TextKey;
export function ActivityEditor(p: {
  activity: ManagedActivity | null;
  facilities: Facility[];
  sports: SportInfo[];
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  /** The activity was just created from this editor. */
  saved: boolean;
  onSaved: (id: string) => void;
  onClose: () => void;
}) {
  const c = useActivityEditorController(p);
  const { t, locale } = p;
  const title = p.activity
    ? fill(t("activityEditing"), {
        name: p.activity.name[locale] || p.activity.name.gl,
      })
    : t("activityNew");
  const required = (label: TextKey) => (
    <Field.Label>
      {t(label)}
      <Field.RequiredIndicator />
    </Field.Label>
  );
  return (
    <section
      className="settings-section"
      aria-labelledby="activity-editor-title"
    >
      <div className="section-heading-row">
        <h2 id="activity-editor-title">{title}</h2>
        <Button
          variant="ghost"
          size="md"
          aria-label={t("activityCloseEditor")}
          onClick={p.onClose}
        >
          <PiX size={20} aria-hidden="true" />
        </Button>
      </div>
      <p className="muted">{t("activityRequiredHint")}</p>
      <form
        id="activity-form"
        className="form-grid settings-grid"
        noValidate
        aria-labelledby="activity-editor-title"
        onSubmit={(event) => {
          void c.submit(event);
        }}
      >
        <Field.Root
          className="field"
          required
          invalid={c.invalid && !c.nameGl.trim()}
        >
          {required("activityNameGl")}
          <Input
            value={c.nameGl}
            maxLength={120}
            onChange={(event) => c.setNameGl(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("activityNameEs")}</Field.Label>
          <Input
            value={c.nameEs}
            maxLength={120}
            onChange={(event) => c.setNameEs(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("activityDescriptionGl")}</Field.Label>
          <Textarea
            value={c.descriptionGl}
            maxLength={2000}
            rows={3}
            onChange={(event) => c.setDescriptionGl(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("activityDescriptionEs")}</Field.Label>
          <Textarea
            value={c.descriptionEs}
            maxLength={2000}
            rows={3}
            onChange={(event) => c.setDescriptionEs(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field" required>
          {required("activitySport")}
          <NativeSelect.Root>
            <NativeSelect.Field
              value={c.sport}
              onChange={(event) => c.setSport(event.target.value)}
            >
              {p.sports.map((sport) => (
                <option key={sport.code} value={sport.code}>
                  {sport.name[locale] || sport.name.gl}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root className="field" required>
          {required("activityFacility")}
          <NativeSelect.Root>
            <NativeSelect.Field
              value={c.facility}
              onChange={(event) => c.setFacilityId(event.target.value)}
            >
              {p.facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        {c.resources.length > 1 && (
          <Field.Root className="field" required>
            {required("activityCourt")}
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
        <fieldset
          className="full checkbox-group"
          aria-invalid={c.invalid && !c.weekdays.length}
        >
          <legend>
            {t("activityDays")} <span aria-hidden="true">*</span>
          </legend>
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
        <Field.Root className="field" required>
          {required("activityStartsLocal")}
          <Input
            type="time"
            value={c.startsLocal}
            onChange={(event) => c.setStartsLocal(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field" required>
          {required("activityEndsLocal")}
          <Input
            type="time"
            value={c.endsLocal}
            onChange={(event) => c.setEndsLocal(event.target.value)}
          />
        </Field.Root>
        <Field.Root
          className="field"
          required
          invalid={c.invalid && !c.startsOn}
        >
          {required("activityStartsOn")}
          <Input
            type="date"
            value={c.startsOn}
            onChange={(event) => c.setStartsOn(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field" required invalid={c.invalid && !c.endsOn}>
          {required("activityEndsOn")}
          <Input
            type="date"
            value={c.endsOn}
            onChange={(event) => c.setEndsOn(event.target.value)}
          />
        </Field.Root>
        <fieldset className="full activity-form-group">
          <legend>{t("activityExceptions")}</legend>
          {c.exceptions.length === 0 ? (
            <p className="muted">{t("activityExceptionsNone")}</p>
          ) : (
            <ul className="exception-list">
              {c.exceptions.map((date) => {
                const label = fullDateLabel(date, locale);
                return (
                  <li key={date}>
                    <span>{label}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={fill(t("activityExceptionRemove"), {
                        date: label,
                      })}
                      onClick={() => c.removeException(date)}
                    >
                      <PiX size={18} aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="exception-add">
            <Field.Root className="field">
              <Field.Label>{t("activityExceptionDate")}</Field.Label>
              <Input
                type="date"
                value={c.exception}
                min={c.startsOn || undefined}
                max={c.endsOn || undefined}
                onChange={(event) => c.setException(event.target.value)}
              />
            </Field.Root>
            <Button
              variant="outline"
              disabled={!c.exception}
              onClick={() => {
                c.addException(c.exception);
                c.setException("");
              }}
            >
              {t("activityExceptionAdd")}
            </Button>
          </div>
        </fieldset>
        <Field.Root className="field" required>
          {required("activityPlaces")}
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={c.places}
            onChange={(event) => c.setPlaces(event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("activityMinAge")}</Field.Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={c.minAge}
            onChange={(event) => c.setMinAge(event.target.value)}
          />
          <Field.HelperText>{t("activityAgeHint")}</Field.HelperText>
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("activityMaxAge")}</Field.Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={c.maxAge}
            onChange={(event) => c.setMaxAge(event.target.value)}
          />
          <Field.HelperText>{t("activityAgeHint")}</Field.HelperText>
        </Field.Root>
        <Field.Root className="field" required>
          {required("activityEnrolmentOpensOn")}
          <Input
            type="date"
            value={c.opensOn}
            onChange={(event) => c.setOpensOn(event.target.value)}
          />
        </Field.Root>
        <Field.Root
          className="field"
          required
          invalid={c.invalid && !c.closesOn}
        >
          {required("activityEnrolmentClosesOn")}
          <Input
            type="date"
            value={c.closesOn}
            max={c.endsOn || undefined}
            onChange={(event) => c.setClosesOn(event.target.value)}
          />
        </Field.Root>
        <fieldset className="full activity-form-group">
          <legend>{t("activityPrices")}</legend>
          <div className="form-grid">
            {c.tariffs.map((tariff) => (
              <Field.Root key={tariff} className="field">
                <Field.Label>
                  {tariff === "general"
                    ? t("activityPriceGeneral")
                    : `${t(categoryLabel(tariff))} (€)`}
                </Field.Label>
                <Input
                  inputMode="decimal"
                  value={c.prices[tariff] ?? ""}
                  onChange={(event) => c.setPrice(tariff, event.target.value)}
                />
                {tariff === "general" && (
                  <Field.HelperText>{t("activityPriceHint")}</Field.HelperText>
                )}
              </Field.Root>
            ))}
          </div>
        </fieldset>
        <div className="full row-actions">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.saving}
            disabled={!c.editable}
          >
            {t(p.activity ? "activitySaveChanges" : "activitySaveDraft")}
          </Button>
          {p.activity?.status === "draft" && (
            <Button
              variant="outline"
              loading={c.publishing}
              onClick={() => {
                void c.publishDraft();
              }}
            >
              {t("activityPublish")}
            </Button>
          )}
        </div>
      </form>
      {c.clashes.length > 0 && (
        <ActivityClashes
          clashes={c.clashes}
          timezone={p.municipality.timezone}
          locale={locale}
          t={t}
          onAdd={c.addException}
          onAddAll={c.addAllClashes}
        />
      )}
      {c.invalid && (
        <p role="alert" className="error-text">
          {t("activityError")}
        </p>
      )}
      {c.failed && (
        <p role="alert" className="error-text">
          {c.failure ?? t("activityError")}
        </p>
      )}
      <div role="status">
        {c.notice === "saved" && <p>{t("activitySaved")}</p>}
        {c.notice === "published" && <p>{t("activityPublished")}</p>}
      </div>
    </section>
  );
}
