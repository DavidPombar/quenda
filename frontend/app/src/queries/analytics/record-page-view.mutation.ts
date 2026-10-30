// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import { analyticsRepository } from "@/repositories/analytics.repository";
export function useRecordPageViewMutation() {
  // A lost page view is not worth an error or a retry.
  return useMutation({
    mutationFn: analyticsRepository.pageView,
    retry: false,
  });
}
