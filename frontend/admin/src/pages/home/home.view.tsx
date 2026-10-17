// SPDX-License-Identifier: AGPL-3.0-or-later
import { Navigate } from "react-router-dom";
import { Feedback } from "@/components/feedback/feedback.view";
import { useHomeController } from "./home.controller";
export function Home() {
  const { query, destination } = useHomeController();
  if (destination) return <Navigate to={destination} replace />;
  return (
    <Feedback
      error={query.isError}
      message={
        query.isError ? "Non puidemos conectar con Quenda." : "Cargando Quenda…"
      }
      retry={
        query.isError
          ? () => {
              void query.refetch();
            }
          : undefined
      }
    />
  );
}
