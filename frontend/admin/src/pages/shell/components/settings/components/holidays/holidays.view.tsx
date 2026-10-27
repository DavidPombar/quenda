// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { PiPlus, PiTrash, PiUploadSimple } from "react-icons/pi";
import { fullDateLabel } from "@/services/date.service";
import type { TextKey } from "@/services/i18n.service";
import type { Locale, MunicipalitySettings } from "@/types/models";
import { useHolidaysController } from "./holidays.controller";
export function Holidays(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const c = useHolidaysController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="holidays-title">
      <h2 id="holidays-title">{t("holidaysSection")}</h2>
      <p className="field-hint">{t("holidaysHint")}</p>
      {c.holidays.length ? (
        <ul className="holiday-list" aria-label={t("holidaysSection")}>
          {c.holidays.map((holiday) => (
            <li key={holiday.date}>
              <span>
                <strong>{holiday.name}</strong>
                <span className="muted">
                  <time dateTime={holiday.date}>
                    {fullDateLabel(holiday.date, p.locale)}
                  </time>
                  {holiday.yearly && ` · ${t("holidayYearlyBadge")}`}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`${t("removeHoliday")}: ${holiday.name}`}
                onClick={() => c.remove(holiday)}
              >
                <PiTrash size={18} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t("holidaysEmpty")}</p>
      )}
      {c.simplified && <p className="notice">{t("holidaysSimplified")}</p>}
      <form
        id="holiday-form"
        className="holiday-form"
        noValidate
        onSubmit={c.add}
      >
        <fieldset className="form-section">
          <legend>{t("addHoliday")}</legend>
          <div className="form-grid settings-grid">
            <Field.Root
              className="field"
              invalid={
                c.addError === "holidayDateError" ||
                c.addError === "holidayDuplicate"
              }
            >
              <Field.Label>{t("holidayDate")}</Field.Label>
              <Input
                name="holiday-date"
                type="date"
                value={c.date}
                onChange={(event) => c.setDate(event.target.value)}
              />
            </Field.Root>
            <Field.Root
              className="field"
              invalid={c.addError === "holidayNameError"}
            >
              <Field.Label>{t("holidayName")}</Field.Label>
              <Input
                name="holiday-name"
                maxLength={120}
                value={c.name}
                onChange={(event) => c.setName(event.target.value)}
              />
            </Field.Root>
            <div className="checkbox-cell">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={c.yearly}
                  onChange={(event) => c.setYearly(event.target.checked)}
                />
                {t("holidayYearly")}
              </label>
            </div>
          </div>
          {c.addError && (
            <p role="alert" className="error-text">
              {t(c.addError)}
            </p>
          )}
          <div className="settings-actions">
            <Button type="submit" variant="outline">
              <PiPlus size={18} aria-hidden="true" />
              {t("addHoliday")}
            </Button>
            <label className="upload-calendar">
              <PiUploadSimple size={18} aria-hidden="true" />
              {t("importCalendar")}
              <input
                className="sr-only"
                type="file"
                accept=".ics,text/calendar"
                onChange={(event) => {
                  void c.importCalendar(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </fieldset>
      </form>
      <div className="settings-actions">
        <Button
          colorPalette="court"
          loading={c.mutation.isPending}
          disabled={!c.dirty}
          onClick={() => {
            void c.save();
          }}
        >
          {t("saveHolidays")}
        </Button>
        {c.message && (
          <p
            role={c.message === "calendarReadError" ? "alert" : "status"}
            className={
              c.message === "calendarReadError"
                ? "error-text"
                : "success-message"
            }
          >
            {t(c.message)}
          </p>
        )}
        {!!c.affected && (
          <p role="status" className="notice">
            {t("holidaysAffected")} {c.affected}
          </p>
        )}
        {c.mutation.error && (
          <p role="alert" className="error-text">
            {c.mutation.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
