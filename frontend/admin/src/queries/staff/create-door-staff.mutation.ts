// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { staffRepository } from "@/repositories/staff.repository";
export function useCreateDoorStaffMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: staffRepository.createDoorStaff,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["staff"] }),
  });
}
