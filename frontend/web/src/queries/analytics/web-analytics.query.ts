// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  type WebHit,
  analyticsRepository,
} from "@/repositories/analytics.repository";
import type { Locale } from "@/services/i18n.service";
/**
 * Counts each page of the website when the deployment's Umami counts it (#57), and returns
 * `track` for the website's only event, a catalogue search. Nothing is sent with DNT or GPC.
 */
export function useWebAnalytics(locale: Locale) {
  const location = useLocation();
  const status = useQuery({
    queryKey: ["analytics", "web"],
    queryFn: analyticsRepository.status,
    staleTime: Infinity,
    enabled: !analyticsRepository.optedOut(),
  });
  const { mutate } = useMutation({
    mutationFn: (hit: WebHit) => analyticsRepository.hit(hit),
    retry: false,
  });
  const on = status.data?.enabled === true;
  const path = location.pathname;
  useEffect(() => {
    if (on)
      mutate({
        path,
        language: locale,
        screen: `${window.screen.width}x${window.screen.height}`,
      });
  }, [on, path, locale, mutate]);
  return {
    track: (event: "search") => {
      if (on)
        mutate({
          path,
          event,
          language: locale,
          screen: `${window.screen.width}x${window.screen.height}`,
        });
    },
  };
}
