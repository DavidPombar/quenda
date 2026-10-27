// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import {
  holidaysCalendar,
  parseHolidays,
  type Holiday,
} from "@/services/holidays.service";
import { isPlainDate } from "@/services/date.service";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
export function useHolidaysController(args: {
  settings: MunicipalitySettings;
}) {
  const initial = parseHolidays(args.settings.holidaysCalendar);
  const [holidays, setHolidays] = useState<Holiday[]>(initial.holidays);
  const [simplified, setSimplified] = useState(initial.simplified);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [yearly, setYearly] = useState(true);
  const [addError, setAddError] = useState<TextKey | "">("");
  const [message, setMessage] = useState<TextKey | "">("");
  const [affected, setAffected] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function change(next: Holiday[]) {
    setHolidays(next.sort((a, b) => a.date.localeCompare(b.date)));
    setDirty(true);
    setMessage("");
    setAffected(null);
  }
  function add(event: FormEvent) {
    event.preventDefault();
    const error: TextKey | "" = !isPlainDate(date)
      ? "holidayDateError"
      : !name.trim()
        ? "holidayNameError"
        : holidays.some((holiday) => holiday.date === date)
          ? "holidayDuplicate"
          : "";
    setAddError(error);
    if (error) {
      document
        .querySelector<HTMLElement>(
          `#holiday-form [name="${error === "holidayNameError" ? "holiday-name" : "holiday-date"}"]`,
        )
        ?.focus();
      return;
    }
    change([...holidays, { date, name: name.trim(), yearly }]);
    setDate("");
    setName("");
  }
  function remove(target: Holiday) {
    change(holidays.filter((holiday) => holiday !== target));
  }
  async function importCalendar(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error("File too large");
      const parsed = parseHolidays(await file.text());
      change(parsed.holidays);
      setSimplified(parsed.simplified);
      setMessage("holidaysImported");
    } catch {
      setMessage("calendarReadError");
    }
  }
  async function save() {
    try {
      const result = await mutation.mutateAsync({
        holidaysCalendar: holidaysCalendar(holidays, args.settings.id),
      });
      setDirty(false);
      setSimplified(false);
      setMessage("settingsSaved");
      setAffected(result.affectedBookings);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    holidays,
    simplified,
    date,
    setDate,
    name,
    setName,
    yearly,
    setYearly,
    addError,
    add,
    remove,
    importCalendar,
    save,
    dirty,
    message,
    affected,
    mutation,
  };
}
