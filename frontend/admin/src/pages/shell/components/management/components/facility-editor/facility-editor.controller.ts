// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useSaveFacilityMutation } from "@/queries/facilities/save-facility.mutation";
import { weeklyCalendar } from "@/services/calendar.service";
import { today } from "@/services/date.service";
import type { Facility, Municipality } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
export function useFacilityEditorController(args: {
  facility?: Facility;
  municipality: Municipality;
  t: (key: TextKey) => string;
  onClose: (saved?: boolean) => void;
}) {
  const [draft, setDraft] = useState<Facility>(() => {
    if (args.facility) return { ...args.facility };
    const id = crypto.randomUUID();
    return {
      id,
      name: "",
      sport: "padel",
      address: "",
      description: "",
      accessible: true,
      status: "active",
      slotMinutes: 60,
      priceCents: 0,
      rules: "",
      openingCalendar: weeklyCalendar({
        id,
        timezone: args.municipality.timezone,
        firstDate: today(args.municipality.timezone),
        days: ["MO", "TU", "WE", "TH", "FR"],
        opening: "09:00",
        closing: "22:00",
      }),
    };
  });
  const [days, setDays] = useState(["MO", "TU", "WE", "TH", "FR"]);
  const [opening, setOpening] = useState("09:00");
  const [closing, setClosing] = useState("22:00");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "address", TextKey>>
  >({});
  const mutation = useSaveFacilityMutation();
  function setField<K extends keyof Facility>(key: K, value: Facility[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "address")
      setErrors((current) => ({ ...current, [key]: undefined }));
  }
  function validate() {
    const next: typeof errors = {};
    if (draft.name.trim().length < 2) next.name = "nameRequired";
    if (draft.address.trim().length < 2) next.address = "addressRequired";
    setErrors(next);
    return next;
  }
  function toggleDay(day: string) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  }
  function applyWeekly() {
    setCalendarError("");
    if (!days.length) {
      setCalendarError(args.t("selectDays"));
      return;
    }
    try {
      setField(
        "openingCalendar",
        weeklyCalendar({
          id: draft.id,
          timezone: args.municipality.timezone,
          firstDate: today(args.municipality.timezone),
          days,
          opening,
          closing,
        }),
      );
      setCalendarMessage(args.t("calendarReady"));
    } catch {
      setCalendarError(args.t("invalidHours"));
    }
  }
  async function importCalendar(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error("File too large");
      setField("openingCalendar", await file.text());
      setCalendarMessage(args.t("calendarReady"));
      setCalendarError("");
    } catch {
      setCalendarError(args.t("calendarReadError"));
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const invalid = Object.keys(validate())[0];
    if (invalid) {
      document
        .querySelector<HTMLElement>(`#facility-form [name="${invalid}"]`)
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({ facility: draft, isNew: !args.facility });
      args.onClose(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    draft,
    setField,
    errors,
    days,
    toggleDay,
    opening,
    setOpening,
    closing,
    setClosing,
    calendarMessage,
    calendarError,
    applyWeekly,
    importCalendar,
    save,
    mutation,
  };
}
