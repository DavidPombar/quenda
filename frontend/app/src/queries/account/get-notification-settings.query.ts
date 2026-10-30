// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
export function useGetNotificationSettingsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["notification-settings", userId],
    queryFn: accountRepository.getNotificationSettings,
    enabled: !!userId,
  });
}
