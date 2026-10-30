// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
import { pushDeviceRepository } from "@/repositories/push-device.repository";
/** Resolves false when the person did not allow notices in the browser prompt. */
export function useEnablePushMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const device = await pushDeviceRepository.subscribe(publicKey);
      if (!device) return false;
      await accountRepository.savePushDevice(device);
      return true;
    },
    onSettled: async () => {
      await cache.invalidateQueries({ queryKey: ["push-device"] });
      await cache.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}
