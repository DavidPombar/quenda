// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useUpdatePhotoMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: facilitiesRepository.updatePhoto,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["facilities"] }),
  });
}
