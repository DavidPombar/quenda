// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useListSportsQuery } from "@/queries/sports/list-sports.query";
import { useCreateSportMutation } from "@/queries/sports/create-sport.mutation";
import { useUpdateSportMutation } from "@/queries/sports/update-sport.mutation";
import { useRemoveSportMutation } from "@/queries/sports/remove-sport.mutation";
import type { TextKey } from "@/services/i18n.service";
import { codeFrom } from "@/services/sports.service";
import type { SportInfo } from "@/types/models";
const CODE = /^[a-z0-9-]{2,40}$/;
/** The municipality's sports catalogue (#26): rename, hide, reorder and add. */
export function useSportsController() {
  const sports = useListSportsQuery();
  const create = useCreateSportMutation();
  const update = useUpdateSportMutation();
  const removal = useRemoveSportMutation();
  const [edits, setEdits] = useState<Record<string, SportInfo>>({});
  const [draft, setDraft] = useState({ gl: "", es: "" });
  const [message, setMessage] = useState<{
    key: TextKey;
    error: boolean;
  } | null>(null);
  const rows = (sports.data ?? []).map((sport) => edits[sport.code] ?? sport);
  function edit(code: string, patch: Partial<SportInfo>) {
    const current = rows.find((sport) => sport.code === code);
    if (current)
      setEdits((value) => ({ ...value, [code]: { ...current, ...patch } }));
  }
  async function run(action: () => Promise<unknown>, done: TextKey) {
    setMessage(null);
    try {
      await action();
      setMessage({ key: done, error: false });
      return true;
    } catch (error) {
      setMessage({
        key:
          (error as { code?: string }).code === "sport_exists"
            ? "sportExists"
            : (error as { code?: string }).code === "sport_in_use"
              ? "sportInUse"
              : (error as { code?: string }).code === "validation"
                ? "sportLastVisible"
                : "sportError",
        error: true,
      });
      return false;
    }
  }
  return {
    sports,
    rows,
    changed: (code: string) => code in edits,
    edit,
    save: async (code: string) => {
      const sport = edits[code];
      if (!sport) return;
      if (sport.name.gl.trim().length < 2 || sport.name.es.trim().length < 2) {
        setMessage({ key: "sportNameRequired", error: true });
        return;
      }
      if (await run(() => update.mutateAsync(sport), "sportSaved"))
        setEdits(({ [code]: _, ...rest }) => rest);
    },
    draft,
    setDraft: (patch: Partial<typeof draft>) =>
      setDraft((value) => ({ ...value, ...patch })),
    code: codeFrom(draft.gl),
    pending: create.isPending || update.isPending || removal.isPending,
    remove: (code: string) =>
      run(() => removal.mutateAsync(code), "sportRemoved").then((done) => {
        if (done) setEdits(({ [code]: _, ...rest }) => rest);
      }),
    message,
    add: async (event: FormEvent) => {
      event.preventDefault();
      const code = codeFrom(draft.gl);
      const name = {
        gl: draft.gl.trim(),
        es: draft.es.trim() || draft.gl.trim(),
      };
      if (!CODE.test(code) || name.gl.length < 2) {
        setMessage({ key: "sportNameRequired", error: true });
        return;
      }
      if (
        await run(
          () =>
            create.mutateAsync({
              code,
              name,
              hidden: false,
              position: rows.length + 1,
            }),
          "sportAdded",
        )
      )
        setDraft({ gl: "", es: "" });
    },
  };
}
