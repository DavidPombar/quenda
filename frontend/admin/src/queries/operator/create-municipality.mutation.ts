// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorRepository } from "@/repositories/operator.repository";
export function useCreateMunicipalityMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: operatorRepository.createMunicipality,
    onSuccess: async () => {
      // The municipality selector and catalogue read the public list.
      await Promise.all(
        [["operator"], ["municipalities"]].map((queryKey) =>
          cache.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
