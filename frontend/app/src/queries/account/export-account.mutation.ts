// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
export function useExportAccountMutation() {
  return useMutation({ mutationFn: accountRepository.exportData });
}
