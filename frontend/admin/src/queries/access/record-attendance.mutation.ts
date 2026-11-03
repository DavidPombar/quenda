// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useRecordAttendanceMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.attendance,
    networkMode: "always",
    onSuccess: async () => {
      await Promise.all(
        ["access-day", "insights", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
