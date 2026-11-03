// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useListDependantsQuery } from "@/queries/dependants/list-dependants.query";
import { useSaveDependantMutation } from "@/queries/dependants/save-dependant.mutation";
import { useRemoveDependantMutation } from "@/queries/dependants/remove-dependant.mutation";
import type { Dependant, Municipality } from "@/types/models";
/** The people in the adult's care: list, add with the declaration, correct and remove (#97). */
export function useMyDependantsController(p: {
  userId: string;
  municipality: Municipality;
}) {
  const query = useListDependantsQuery(p.userId);
  const save = useSaveDependantMutation();
  const remove = useRemoveDependantMutation();
  const year = Temporal.Now.zonedDateTimeISO(p.municipality.timezone).year;
  const [editing, setEditing] = useState<Dependant | "new" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [declared, setDeclared] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [removing, setRemoving] = useState<Dependant | null>(null);
  const [attempt, setAttempt] = useState(() => crypto.randomUUID());
  function open(target: Dependant | "new") {
    save.reset();
    setInvalid(false);
    setEditing(target);
    setFirstName(target === "new" ? "" : target.firstName);
    setBirthYear(target === "new" ? "" : String(target.birthYear));
    setDeclared(target !== "new");
    setAttempt(crypto.randomUUID());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const born = Number(birthYear);
    if (
      !firstName.trim() ||
      !Number.isInteger(born) ||
      born < year - 120 ||
      born > year ||
      !declared
    ) {
      setInvalid(true);
      return;
    }
    try {
      await save.mutateAsync({
        id: editing === "new" || !editing ? attempt : editing.id,
        existing: editing !== "new",
        firstName: firstName.trim(),
        birthYear: born,
      });
      setEditing(null);
    } catch {
      /* The form shows the error. */
    }
  }
  return {
    query,
    save,
    remove,
    year,
    editing,
    open,
    close: () => setEditing(null),
    firstName,
    setFirstName,
    birthYear,
    setBirthYear,
    declared,
    setDeclared,
    invalid,
    submit,
    removing,
    askRemove: (dependant: Dependant) => {
      remove.reset();
      setRemoving(dependant);
    },
    cancelRemove: () => setRemoving(null),
    confirmRemove: () =>
      removing &&
      remove.mutate(removing.id, { onSuccess: () => setRemoving(null) }),
  };
}
