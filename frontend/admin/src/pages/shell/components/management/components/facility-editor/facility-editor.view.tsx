// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  NativeSelect,
  Button,
  Dialog,
  Field,
  Portal,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { PiCaretRight, PiUploadSimple, PiX } from "react-icons/pi";
import type { Facility, Municipality } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
import { useFacilityEditorController } from "./facility-editor.controller";
const WEEKDAYS = [
  ["MO", "mon"],
  ["TU", "tue"],
  ["WE", "wed"],
  ["TH", "thu"],
  ["FR", "fri"],
  ["SA", "sat"],
  ["SU", "sun"],
] as const;
export function FacilityEditor(p: {
  facility?: Facility;
  municipality: Municipality;
  t: (key: TextKey) => string;
  onClose: (saved?: boolean) => void;
}) {
  const c = useFacilityEditorController(p);
  const { t } = p;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.mutation.isPending) p.onClose();
      }}
      placement="center"
      size="xl"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal editor-modal">
            <Dialog.Header>
              <Dialog.Title>
                {p.facility ? t("editFacility") : t("newFacility")}
              </Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.facility ? p.facility.name : t("newFacilityHint")}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="facility-form"
                noValidate
                onSubmit={(event) => {
                  void c.save(event);
                }}
              >
                <fieldset className="form-section">
                  <legend>{t("generalSection")}</legend>
                  <div className="form-grid">
                    <Field.Root
                      className="field full"
                      required
                      invalid={!!c.errors.name}
                    >
                      <Field.Label>
                        {t("facilityName")}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        name="name"
                        minLength={2}
                        maxLength={120}
                        value={c.draft.name}
                        onChange={(event) =>
                          c.setField("name", event.target.value)
                        }
                      />
                      {c.errors.name && (
                        <Field.ErrorText>{t(c.errors.name)}</Field.ErrorText>
                      )}
                    </Field.Root>
                    <Field.Root
                      className="field full"
                      required
                      invalid={!!c.errors.address}
                    >
                      <Field.Label>
                        {t("address")}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        name="address"
                        minLength={2}
                        value={c.draft.address}
                        onChange={(event) =>
                          c.setField("address", event.target.value)
                        }
                      />
                      {c.errors.address && (
                        <Field.ErrorText>{t(c.errors.address)}</Field.ErrorText>
                      )}
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("sport")}</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={c.draft.sport}
                          onChange={(event) =>
                            c.setField(
                              "sport",
                              event.target.value as Facility["sport"],
                            )
                          }
                        >
                          {(
                            ["padel", "tennis", "futsal", "swimming"] as const
                          ).map((sport) => (
                            <option key={sport} value={sport}>
                              {t(sport)}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <div className="checkbox-cell">
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={c.draft.accessible}
                          onChange={(event) =>
                            c.setField("accessible", event.target.checked)
                          }
                        />
                        {t("accessible")}
                      </label>
                    </div>
                    <div className="checkbox-cell">
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={c.draft.followsMunicipalHolidays}
                          onChange={(event) =>
                            c.setField(
                              "followsMunicipalHolidays",
                              event.target.checked,
                            )
                          }
                        />
                        {t("followsHolidays")}
                      </label>
                    </div>
                    <Field.Root className="field full">
                      <Field.Label>{t("description")}</Field.Label>
                      <Textarea
                        rows={3}
                        value={c.draft.description}
                        onChange={(event) =>
                          c.setField("description", event.target.value)
                        }
                      />
                      <Field.HelperText>
                        {t("descriptionHint")}
                      </Field.HelperText>
                    </Field.Root>
                  </div>
                </fieldset>
                <fieldset className="form-section">
                  <legend>{t("bookingSection")}</legend>
                  <div className="form-grid">
                    <Field.Root className="field">
                      <Field.Label>{t("status")}</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={c.draft.status}
                          onChange={(event) =>
                            c.setField(
                              "status",
                              event.target.value as Facility["status"],
                            )
                          }
                        >
                          {(["active", "maintenance", "closed"] as const).map(
                            (status) => (
                              <option key={status} value={status}>
                                {t(status)}
                              </option>
                            ),
                          )}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("duration")}</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={c.draft.slotMinutes}
                          onChange={(event) =>
                            c.setField(
                              "slotMinutes",
                              Number(event.target.value),
                            )
                          }
                        >
                          {[30, 60, 90, 120].map((duration) => (
                            <option key={duration} value={duration}>
                              {duration}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("price")}</Field.Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="1000"
                        step="0.01"
                        value={c.draft.priceCents / 100}
                        onChange={(event) =>
                          c.setField(
                            "priceCents",
                            Math.round(Number(event.target.value) * 100),
                          )
                        }
                      />
                      <Field.HelperText>{t("priceHint")}</Field.HelperText>
                    </Field.Root>
                    <Field.Root className="field full">
                      <Field.Label>{t("rules")}</Field.Label>
                      <Textarea
                        rows={3}
                        value={c.draft.rules}
                        onChange={(event) =>
                          c.setField("rules", event.target.value)
                        }
                      />
                      <Field.HelperText>{t("rulesHint")}</Field.HelperText>
                    </Field.Root>
                  </div>
                </fieldset>
                <fieldset className="form-section calendar-editor">
                  <legend>{t("calendar")}</legend>
                  <p className="field-hint">{t("calendarHint")}</p>
                  <details className="disclosure" open={!p.facility}>
                    <summary>
                      <PiCaretRight size={18} aria-hidden="true" />
                      {t("weekly")}
                    </summary>
                    <div className="disclosure-body">
                      <fieldset className="weekday-options">
                        <legend>{t("weekdays")}</legend>
                        {WEEKDAYS.map(([day, key]) => (
                          <label key={day}>
                            <input
                              type="checkbox"
                              checked={c.days.includes(day)}
                              onChange={() => c.toggleDay(day)}
                            />
                            {t(key)}
                          </label>
                        ))}
                      </fieldset>
                      <div className="form-grid">
                        <Field.Root className="field">
                          <Field.Label>{t("opening")}</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={c.opening}
                              onChange={(event) =>
                                c.setOpening(event.target.value)
                              }
                            >
                              {c.times.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root className="field">
                          <Field.Label>{t("closing")}</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={c.closing}
                              onChange={(event) =>
                                c.setClosing(event.target.value)
                              }
                            >
                              {c.times.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Field.Root>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={c.applyWeekly}
                      >
                        {t("applyWeekly")}
                      </Button>
                    </div>
                  </details>
                  <label className="upload-calendar">
                    <PiUploadSimple size={18} aria-hidden="true" />
                    {t("importCalendar")}
                    <input
                      className="sr-only"
                      type="file"
                      accept=".ics,text/calendar"
                      onChange={(event) => {
                        void c.importCalendar(event.target.files?.[0]);
                      }}
                    />
                  </label>
                  <details className="disclosure">
                    <summary>
                      <PiCaretRight size={18} aria-hidden="true" />
                      {t("advancedCalendar")}
                    </summary>
                    <div className="disclosure-body">
                      <label className="field">
                        <span className="sr-only">iCalendar</span>
                        <Textarea
                          className="calendar-source"
                          value={c.draft.openingCalendar}
                          onChange={(event) =>
                            c.setField("openingCalendar", event.target.value)
                          }
                          rows={10}
                          spellCheck={false}
                        />
                      </label>
                    </div>
                  </details>
                  {c.calendarMessage && (
                    <p role="status" className="success-message">
                      {c.calendarMessage}
                    </p>
                  )}
                  {c.calendarError && (
                    <p role="alert" className="error-text">
                      {c.calendarError}
                    </p>
                  )}
                  <p className="notice">{t("calendarNote")}</p>
                </fieldset>
                {c.mutation.error && (
                  <p role="alert" className="error-text">
                    {c.mutation.error.message}
                  </p>
                )}
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => p.onClose()}
                disabled={c.mutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                colorPalette="court"
                type="submit"
                form="facility-form"
                loading={c.mutation.isPending}
              >
                {p.facility ? t("save") : t("create")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                px="0"
                aria-label={t("close")}
                disabled={c.mutation.isPending}
              >
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
