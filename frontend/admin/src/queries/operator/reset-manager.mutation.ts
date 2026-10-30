// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import { operatorRepository } from "@/repositories/operator.repository";
export function useResetManagerMutation() {
  return useMutation({ mutationFn: operatorRepository.resetManager });
}
