// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useParams } from "react-router-dom";
import { useGetActivityQuery } from "@/queries/activities/get-activity.query";
import type { AppContext } from "@/types/app-context";
/** Sessions shown before "show all". */
const SHOWN = 10;
export function useActivityDetailsController() {
  const context = useOutletContext<AppContext>();
  const { id = "" } = useParams();
  const query = useGetActivityQuery(context.municipality.slug, id);
  const sessions = query.data?.sessions ?? [];
  return {
    ...context,
    query,
    activity: query.data,
    sessions: sessions.slice(0, SHOWN),
    more: Math.max(sessions.length - SHOWN, 0),
  };
}
