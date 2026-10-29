// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useSaveResourcesMutation } from "@/queries/facilities/save-resources.mutation";
import type { Facility, ResourceDraft } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
export function useResourcesDialogController(args: {
  facility: Facility;
  t: (key: TextKey) => string;
  onClose: (saved?: boolean) => void;
}) {
  const [rows, setRows] = useState<ResourceDraft[]>(() =>
    [...(args.facility.resources ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(({ id, name, parentId, active }) => ({
        id,
        name,
        parentId,
        active,
      })),
  );
  const [invalid, setInvalid] = useState(false);
  const mutation = useSaveResourcesMutation();
  const hasParts = (id: string) => rows.some((row) => row.parentId === id);
  /** Whole courts a row can be a part of: courts of their own, other than itself. */
  const parents = (id: string) =>
    rows.filter((row) => row.parentId === null && row.id !== id);
  function update(id: string, change: Partial<ResourceDraft>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...change } : row)),
    );
    setInvalid(false);
  }
  function move(index: number, by: -1 | 1) {
    setRows((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }
  // Removing a whole court leaves its parts as courts of their own.
  function remove(id: string) {
    setRows((current) =>
      current
        .filter((row) => row.id !== id)
        .map((row) => (row.parentId === id ? { ...row, parentId: null } : row)),
    );
  }
  function add() {
    const id = crypto.randomUUID();
    setRows((current) => [
      ...current,
      { id, name: "", parentId: null, active: true },
    ]);
    // Focus the new name field once it renders.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-resource="${id}"]`)?.focus(),
    );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const names = rows.map((row) => row.name.trim().toLocaleLowerCase());
    if (names.some((name) => !name) || new Set(names).size !== names.length) {
      setInvalid(true);
      return;
    }
    try {
      await mutation.mutateAsync({
        facilityId: args.facility.id,
        resources: rows.map((row) => ({ ...row, name: row.name.trim() })),
      });
      args.onClose(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    rows,
    invalid,
    hasParts,
    parents,
    update,
    move,
    remove,
    add,
    save,
    mutation,
  };
}
