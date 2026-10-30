// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useListDeploymentQuery } from "@/queries/operator/list-deployment.query";
import { useResetManagerMutation } from "@/queries/operator/reset-manager.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import type { DeploymentMunicipality } from "@/types/models";
import type { OperatorContext } from "@/types/operator-context";
export function useDeploymentController() {
  const context = useOutletContext<OperatorContext>();
  const municipalities = useListDeploymentQuery(context.session.operatorId);
  const [creating, setCreating] = useState(false);
  const [addingManager, setAddingManager] =
    useState<DeploymentMunicipality | null>(null);
  const [notice, setNotice] = useState("");
  const reset = useResetManagerMutation();
  const [resetDone, setResetDone] = useState<{
    name: string;
    login: string;
    password: string;
  } | null>(null);
  return {
    ...context,
    municipalities,
    creating,
    openCreate: () => {
      setNotice("");
      setCreating(true);
    },
    closeCreate: (name?: string) => {
      setCreating(false);
      if (name)
        setNotice(`${context.t("operatorMunicipalityCreated")} ${name}`);
    },
    addingManager,
    openManager: (value: DeploymentMunicipality) => {
      setNotice("");
      setAddingManager(value);
    },
    closeManager: (name?: string) => {
      setAddingManager(null);
      if (name) setNotice(`${context.t("operatorManagerCreated")} ${name}`);
    },
    notice,
    reset,
    resetDone,
    closeReset: () => setResetDone(null),
    resetManager: async (
      item: DeploymentMunicipality,
      manager: { id: string; displayName: string },
    ) => {
      setNotice("");
      try {
        const value = await reset.mutateAsync({
          municipalityId: item.settings.id,
          userId: manager.id,
        });
        if (value.temporaryPassword)
          setResetDone({
            name: manager.displayName,
            login: value.login,
            password: value.temporaryPassword,
          });
      } catch {
        /* Mutation state presents the error. */
      }
    },
    managementUrl: (slug: string) => routeFor(slug, ROUTES.management),
  };
}
