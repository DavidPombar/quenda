// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useListSportsQuery } from "@/queries/sports/list-sports.query";
import { useSaveSportsMutation } from "@/queries/sports/save-sports.mutation";
import type { ManagedSport, SportDraft } from "@/types/models";
/** A row being edited; `isNew` rows may still change their code. */
export interface SportRow extends SportDraft {
  key: string;
  isNew: boolean;
}
const toRow = (sport: ManagedSport): SportRow => ({
  key: sport.code,
  isNew: false,
  code: sport.code,
  nameGl: sport.name.gl,
  nameEs: sport.name.es,
  cnidClass: sport.cnidClass,
  cnidType: sport.cnidType,
  schemaType: sport.schemaType,
  art: sport.art,
  visible: sport.visible,
});
/** A stable code from the Galician name: lowercase ASCII letters, digits and dashes. */
export function codeFrom(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
export function useSportsController(args: { userId: string | undefined }) {
  const query = useListSportsQuery(args.userId);
  const mutation = useSaveSportsMutation();
  const [rows, setRows] = useState<SportRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (query.data && !dirty) setRows(query.data.map(toRow));
  }, [query.data, dirty]);
  function change(next: SportRow[]) {
    setRows(next);
    setDirty(true);
    setSaved(false);
    setInvalid(false);
  }
  function update(key: string, patch: Partial<SportRow>) {
    change(
      rows.map((row) =>
        row.key !== key
          ? row
          : {
              ...row,
              ...patch,
              // A new sport's code follows its Galician name until it is saved.
              ...(row.isNew && patch.nameGl !== undefined
                ? { code: codeFrom(patch.nameGl) }
                : {}),
            },
      ),
    );
  }
  function move(index: number, by: -1 | 1) {
    const next = [...rows];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    change(next);
  }
  function add() {
    const key = crypto.randomUUID();
    change([
      ...rows,
      {
        key,
        isNew: true,
        code: "",
        nameGl: "",
        nameEs: "",
        cnidClass: "Pistas",
        cnidType: "Pista polideportiva",
        schemaType: "SportsActivityLocation",
        art: "generic",
        visible: true,
      },
    ]);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-sport="${key}"]`)?.focus(),
    );
  }
  async function save() {
    const distinct = (values: string[]) =>
      new Set(values.map((value) => value.trim().toLocaleLowerCase())).size ===
      values.length;
    if (
      rows.some(
        (row) =>
          !row.nameGl.trim() ||
          !row.nameEs.trim() ||
          !/^[a-z0-9-]{2,40}$/.test(row.code),
      ) ||
      !distinct(rows.map((row) => row.nameGl)) ||
      !distinct(rows.map((row) => row.nameEs)) ||
      !distinct(rows.map((row) => row.code)) ||
      !rows.some((row) => row.visible)
    ) {
      setInvalid(true);
      return;
    }
    try {
      const result = await mutation.mutateAsync(
        rows.map(({ key: _key, isNew: _isNew, ...sport }) => sport),
      );
      setRows(result.map(toRow));
      setDirty(false);
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    query,
    rows,
    update,
    move,
    remove: (key: string) => change(rows.filter((row) => row.key !== key)),
    add,
    save,
    dirty,
    saved,
    invalid,
    mutation,
  };
}
