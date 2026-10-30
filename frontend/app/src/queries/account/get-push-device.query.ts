// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { pushDeviceRepository } from "@/repositories/push-device.repository";
/** This browser's support, permission and subscription; asks the person nothing. */
export function useGetPushDeviceQuery() {
  return useQuery({
    queryKey: ["push-device"],
    queryFn: async () => {
      const support = pushDeviceRepository.support();
      if (support !== "supported")
        return { support, permission: "default" as const, endpoint: null };
      return {
        support,
        permission: pushDeviceRepository.permission(),
        endpoint: (await pushDeviceRepository.current())?.endpoint ?? null,
      };
    },
  });
}
