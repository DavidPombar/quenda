// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import {
  activityClashes,
  useSaveActivityMutation,
} from "@/queries/activities/save-activity.mutation";
import { usePublishActivityMutation } from "@/queries/activities/publish-activity.mutation";
import { centsFromInput } from "@/services/tariff.service";
import { today } from "@/services/date.service";
import type {
  ActivityClash,
  ActivityInput,
  ActivityPrice,
  Category,
  Facility,
  ManagedActivity,
  Municipality,
  SportInfo,
} from "@/types/models";
type Tariff = Category | "general";
const euros = (cents: number | undefined) =>
  cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");
const age = (value: string) => (value.trim() ? Number(value) : null);
/** The editor of one activity (#97): a draft is saved, then published from here. */
export function useActivityEditorController(p: {
  activity: ManagedActivity | null;
  facilities: Facility[];
  sports: SportInfo[];
  municipality: Municipality;
  saved: boolean;
  onSaved: (id: string) => void;
}) {
  const save = useSaveActivityMutation();
  const publish = usePublishActivityMutation();
  const a = p.activity;
  const [nameGl, setNameGl] = useState(a?.name.gl ?? "");
  const [nameEs, setNameEs] = useState(a?.name.es ?? "");
  const [descriptionGl, setDescriptionGl] = useState(a?.description.gl ?? "");
  const [descriptionEs, setDescriptionEs] = useState(a?.description.es ?? "");
  const [sport, setSport] = useState(a?.sport ?? p.sports[0]?.code ?? "");
  const [facilityId, setFacilityId] = useState(
    a?.facilityId ?? p.facilities[0]?.id ?? "",
  );
  const [resourceId, setResourceId] = useState(a?.resourceId ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(a?.rule.weekdays ?? []);
  const [startsLocal, setStartsLocal] = useState(
    a?.rule.startsLocal ?? "17:00",
  );
  const [endsLocal, setEndsLocal] = useState(a?.rule.endsLocal ?? "18:00");
  const [startsOn, setStartsOn] = useState(a?.rule.startsOn ?? "");
  const [endsOn, setEndsOn] = useState(a?.rule.endsOn ?? "");
  const [exceptions, setExceptions] = useState<string[]>(
    a?.rule.exceptions ?? [],
  );
  const [exception, setException] = useState("");
  const [places, setPlaces] = useState(String(a?.places ?? 10));
  const [minAge, setMinAge] = useState(
    a?.minAge === null || a?.minAge === undefined ? "" : String(a.minAge),
  );
  const [maxAge, setMaxAge] = useState(
    a?.maxAge === null || a?.maxAge === undefined ? "" : String(a.maxAge),
  );
  const [opensOn, setOpensOn] = useState(
    a?.enrolmentOpensOn ?? today(p.municipality.timezone),
  );
  const [closesOn, setClosesOn] = useState(a?.enrolmentClosesOn ?? "");
  const tariffs: Tariff[] = ["general", ...p.municipality.enabledCategories];
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      tariffs.map((tariff) => [
        tariff,
        euros(a?.prices.find((price) => price.category === tariff)?.priceCents),
      ]),
    ),
  );
  const [clashes, setClashes] = useState<ActivityClash[]>([]);
  const [invalid, setInvalid] = useState(false);
  const [notice, setNotice] = useState<"saved" | "published" | null>(
    p.saved ? "saved" : null,
  );
  const facility =
    p.facilities.find((item) => item.id === facilityId) ?? p.facilities[0];
  const resources = (facility?.resources ?? []).filter((item) => item.active);
  const resource =
    resources.find((item) => item.id === resourceId)?.id ??
    resources[0]?.id ??
    facility?.id ??
    "";
  const editable = !a || a.status !== "cancelled";
  function input(): ActivityInput | null {
    const amounts: ActivityPrice[] = [];
    for (const tariff of tariffs) {
      const cents = centsFromInput(prices[tariff] ?? "");
      if (cents === null) continue;
      if (Number.isNaN(cents)) return null;
      amounts.push({ category: tariff, priceCents: cents });
    }
    const count = Number(places);
    if (
      !nameGl.trim() ||
      !sport ||
      !facility ||
      !weekdays.length ||
      !startsOn ||
      !endsOn ||
      !opensOn ||
      !closesOn ||
      !Number.isInteger(count) ||
      count < 1
    )
      return null;
    return {
      facilityId: facility.id,
      resourceId: resource,
      sport,
      name: { gl: nameGl.trim(), es: nameEs.trim() },
      description: { gl: descriptionGl.trim(), es: descriptionEs.trim() },
      rule: {
        weekdays: [...weekdays].sort((x, y) => x - y),
        startsLocal,
        endsLocal,
        startsOn,
        endsOn,
        exceptions: [...exceptions].sort(),
      },
      places: count,
      minAge: age(minAge),
      maxAge: age(maxAge),
      enrolmentOpensOn: opensOn,
      enrolmentClosesOn: closesOn,
      prices: amounts,
    };
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setClashes([]);
    const value = input();
    if (!value) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    try {
      const saved = await save.mutateAsync({ id: a?.id, input: value });
      setNotice("saved");
      if (!a) p.onSaved(saved.id);
    } catch (error) {
      setClashes(activityClashes(error));
    }
  }
  async function publishDraft() {
    if (!a) return;
    setNotice(null);
    setClashes([]);
    publish.reset();
    try {
      await publish.mutateAsync(a.id);
      setNotice("published");
    } catch (error) {
      setClashes(activityClashes(error));
    }
  }
  const addException = (date: string) => {
    if (date)
      setExceptions((current) =>
        current.includes(date) ? current : [...current, date].sort(),
      );
    setClashes((current) => current.filter((clash) => clash.date !== date));
  };
  return {
    editable,
    nameGl,
    setNameGl,
    nameEs,
    setNameEs,
    descriptionGl,
    setDescriptionGl,
    descriptionEs,
    setDescriptionEs,
    sport,
    setSport,
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
    startsOn,
    setStartsOn,
    endsOn,
    setEndsOn,
    exceptions,
    exception,
    setException,
    addException,
    removeException: (date: string) =>
      setExceptions((current) => current.filter((value) => value !== date)),
    places,
    setPlaces,
    minAge,
    setMinAge,
    maxAge,
    setMaxAge,
    opensOn,
    setOpensOn,
    closesOn,
    setClosesOn,
    tariffs,
    prices,
    setPrice: (tariff: string, value: string) =>
      setPrices((current) => ({ ...current, [tariff]: value })),
    clashes,
    addAllClashes: () => {
      for (const clash of clashes) addException(clash.date);
    },
    invalid,
    notice,
    submit,
    publishDraft,
    saving: save.isPending,
    publishing: publish.isPending,
    failed:
      (save.isError || publish.isError) && clashes.length === 0,
  };
}
