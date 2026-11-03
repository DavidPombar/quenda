// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dependantsRepository } from "@/repositories/dependants.repository";
/** The version of the guardianship declaration the app shows (#97). */
export const DECLARATION_VERSION = "2026-11";
/** Adds a person in the adult's care, or corrects one when `id` names an existing one. */
export function useSaveDependantMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      existing: boolean;
      firstName: string;
      birthYear: number;
    }) =>
      args.existing
        ? dependantsRepository.update(args)
        : dependantsRepository.add({
            id: args.id,
            firstName: args.firstName,
            birthYear: args.birthYear,
            declared: true,
            declarationVersion: DECLARATION_VERSION,
          }),
    onSettled: () =>
      Promise.all(
        ["dependants", "enrolments"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
