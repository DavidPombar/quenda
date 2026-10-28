// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useListDeploymentQuery } from "@/queries/operator/list-deployment.query";
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
    managementUrl: (slug: string) => routeFor(slug, ROUTES.management),
  };
}
