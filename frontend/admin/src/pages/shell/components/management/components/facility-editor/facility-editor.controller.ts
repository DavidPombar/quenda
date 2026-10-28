// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useSaveFacilityMutation } from "@/queries/facilities/save-facility.mutation";
import { useGetFacilityImpactQuery } from "@/queries/facilities/get-facility-impact.query";
import { dayTimes, weeklyCalendar } from "@/services/calendar.service";
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
      followsMunicipalHolidays: true,
      latitude: null,
      longitude: null,
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
    Partial<Record<"name" | "address" | "latitude" | "longitude", TextKey>>
  >({});
  // Coordinates are edited as text so a half-typed number is not lost; parsed when saving.
  const [coordinates, setCoordinates] = useState(() => ({
    latitude: args.facility?.latitude?.toString() ?? "",
    longitude: args.facility?.longitude?.toString() ?? "",
  }));
  const mutation = useSaveFacilityMutation();
  // Closing an active facility cancels its upcoming bookings, so it asks first (C3).
  const shuttingDown =
    !!args.facility &&
    args.facility.status === "active" &&
    draft.status !== "active";
  const impact = useGetFacilityImpactQuery(draft.id, shuttingDown);
  const [confirming, setConfirming] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [reasonInvalid, setReasonInvalid] = useState(false);
  function setField<K extends keyof Facility>(key: K, value: Facility[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "address")
      setErrors((current) => ({ ...current, [key]: undefined }));
  }
  function setCoordinate(key: "latitude" | "longitude", value: string) {
    setCoordinates((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({
      ...current,
      latitude: undefined,
      longitude: undefined,
    }));
  }
  function parsedCoordinates() {
    const parse = (text: string) =>
      text.trim() === "" ? null : Number(text.trim().replace(",", "."));
    return {
      latitude: parse(coordinates.latitude),
      longitude: parse(coordinates.longitude),
    };
  }
  function validate() {
    const next: typeof errors = {};
    if (draft.name.trim().length < 2) next.name = "nameRequired";
    if (draft.address.trim().length < 2) next.address = "addressRequired";
    const { latitude, longitude } = parsedCoordinates();
    if (latitude !== null && !(Math.abs(latitude) <= 90))
      next.latitude = "latitudeInvalid";
    if (longitude !== null && !(Math.abs(longitude) <= 180))
      next.longitude = "longitudeInvalid";
    if (
      !next.latitude &&
      !next.longitude &&
      (latitude === null) !== (longitude === null)
    )
      next[latitude === null ? "latitude" : "longitude"] = "coordinatesPair";
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
    if (shuttingDown && !confirming) {
      const affected = (await impact.refetch()).data;
      if (affected?.bookings) {
        mutation.reset();
        setConfirming(true);
        return;
      }
    }
    if (confirming && closureReason.trim().length < 3) {
      setReasonInvalid(true);
      document.querySelector<HTMLElement>('[name="closureReason"]')?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({
        facility: { ...draft, ...parsedCoordinates() },
        isNew: !args.facility,
        ...(confirming && { closureReason: closureReason.trim() }),
      });
      args.onClose(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    draft,
    setField,
    coordinates,
    setCoordinate,
    errors,
    days,
    toggleDay,
    times: dayTimes(),
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
    impact,
    confirming,
    closureReason,
    reasonInvalid,
    setClosureReason: (value: string) => {
      setClosureReason(value);
      setReasonInvalid(false);
    },
    backToForm: () => {
      mutation.reset();
      setConfirming(false);
    },
  };
}
