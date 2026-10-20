// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useGetAccountQuery } from "@/queries/account/get-account.query";
import { useExportAccountMutation } from "@/queries/account/export-account.mutation";
import { useDeleteAccountMutation } from "@/queries/account/delete-account.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import type { AppContext } from "@/types/app-context";
import type { AccountExport } from "@/types/models";
// The browser needs a moment to start the download before the URL is revoked.
const REVOKE_DELAY_MS = 1000;
function saveAsFile(data: AccountExport, slug: string) {
  const day = data.generatedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `quenda-${slug}-${day}.json`;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
export function useAccountController() {
  const context = useOutletContext<AppContext>();
  const navigate = useNavigate();
  const query = useGetAccountQuery(context.session?.userId);
  const exportData = useExportAccountMutation();
  const remove = useDeleteAccountMutation();
  const [deleting, setDeleting] = useState(false);
  const latestConsent = query.data?.consents.reduce<
    (typeof query.data.consents)[number] | null
  >(
    (latest, consent) =>
      !latest || consent.acceptedAt > latest.acceptedAt ? consent : latest,
    null,
  );
  async function download() {
    try {
      const data = await exportData.mutateAsync();
      saveAsFile(data, context.municipality.slug);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function confirmDelete() {
    try {
      await remove.mutateAsync();
      setDeleting(false);
      await navigate(routeFor(context.municipality.slug, ROUTES.catalog), {
        state: { notice: "deleteDone" },
      });
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    ...context,
    query,
    account: query.data,
    latestConsent: latestConsent ?? null,
    exportData,
    download,
    deleting,
    openDelete: () => {
      remove.reset();
      setDeleting(true);
    },
    closeDelete: () => {
      if (!remove.isPending) setDeleting(false);
    },
    remove,
    confirmDelete,
  };
}
