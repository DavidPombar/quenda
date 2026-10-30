// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import {
  type AnalyticsHit,
  analyticsRepository,
} from "@/repositories/analytics.repository";
export function useRecordAnalyticsMutation() {
  // A lost page view is not worth an error or a retry.
  return useMutation({
    mutationFn: async (hit: AnalyticsHit) => {
      if (!analyticsRepository.optedOut()) await analyticsRepository.hit(hit);
    },
    retry: false,
  });
}
