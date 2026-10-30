// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useListStaffQuery } from "@/queries/staff/list-staff.query";
import { useCreateDoorStaffMutation } from "@/queries/staff/create-door-staff.mutation";
import { useUpdateDoorStaffMutation } from "@/queries/staff/update-door-staff.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { StaffAccount } from "@/types/models";
const LOGIN = /^[A-Za-z0-9._-]{3,64}$/;
/** Accounts of the people who run the service in the municipality (#8). */
export function useStaffController() {
  const context = useOutletContext<AppContext>();
  const isManager = context.session?.role === "manager";
  const staff = useListStaffQuery(isManager);
  const create = useCreateDoorStaffMutation();
  const update = useUpdateDoorStaffMutation();
  const [draft, setDraft] = useState({ displayName: "", login: "" });
  const [error, setError] = useState<TextKey | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [shown, setShown] = useState<{
    name: string;
    login: string;
    password: string;
  } | null>(null);
  function failed(failure: unknown) {
    const code = (failure as { code?: string }).code;
    setError(
      code === "login_taken"
        ? "staffLoginTaken"
        : code === "local_accounts_unavailable"
          ? "staffUnavailable"
          : "staffSaveError",
    );
  }
  return {
    ...context,
    isManager,
    staff,
    managers: (staff.data ?? []).filter((item) => item.role === "manager"),
    doorStaff: (staff.data ?? []).filter((item) => item.role === "access"),
    draft,
    edit: (patch: Partial<typeof draft>) =>
      setDraft((current) => ({ ...current, ...patch })),
    error,
    notice,
    pending: create.isPending || update.isPending,
    shown,
    closeShown: () => setShown(null),
    create: async (event: FormEvent) => {
      event.preventDefault();
      setError(null);
      setNotice("");
      if (draft.displayName.trim().length < 2) {
        setError("staffNameError");
        return;
      }
      if (!LOGIN.test(draft.login.trim())) {
        setError("operatorLoginError");
        return;
      }
      try {
        const value = await create.mutateAsync({
          id: crypto.randomUUID(),
          displayName: draft.displayName.trim(),
          login: draft.login.trim(),
        });
        if (value.temporaryPassword)
          setShown({
            name: draft.displayName.trim(),
            login: value.login,
            password: value.temporaryPassword,
          });
        setDraft({ displayName: "", login: "" });
      } catch (failure) {
        failed(failure);
      }
    },
    update: async (
      person: StaffAccount,
      action: "reset" | "disable" | "enable",
    ) => {
      setError(null);
      setNotice("");
      try {
        const value = await update.mutateAsync({
          userId: person.userId,
          action,
        });
        if (value.temporaryPassword)
          setShown({
            name: person.displayName,
            login: value.login,
            password: value.temporaryPassword,
          });
        else
          setNotice(
            `${context.t(action === "disable" ? "staffDisabledNotice" : "staffEnabledNotice")} ${person.displayName}`,
          );
      } catch (failure) {
        failed(failure);
      }
    },
  };
}
