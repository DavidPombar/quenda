// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { SportOption } from "@/types/models";
export const sportsRepository = {
  /** Sports offered by some facility of these municipalities (all when empty). */
  list: (municipalities: string[]) =>
    apiClient.request<SportOption[]>(
      `public/sports${municipalities.length ? `?municipality=${municipalities.map(encodeURIComponent).join(",")}` : ""}`,
    ),
};
