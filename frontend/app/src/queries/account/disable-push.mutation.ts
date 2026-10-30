// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
import { pushDeviceRepository } from "@/repositories/push-device.repository";
export function useDisablePushMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const subscription = await pushDeviceRepository.current();
      if (!subscription) return;
      await accountRepository.removePushDevice(subscription.endpoint);
      await subscription.unsubscribe();
    },
    onSettled: async () => {
      await cache.invalidateQueries({ queryKey: ["push-device"] });
      await cache.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}
