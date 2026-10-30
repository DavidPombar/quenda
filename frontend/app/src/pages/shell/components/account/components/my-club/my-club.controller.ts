// SPDX-License-Identifier: AGPL-3.0-or-later
import { useGetMyClubQuery } from "@/queries/seasons/get-my-club.query";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import type { Locale, Municipality } from "@/types/models";
export function useMyClubController(p: {
  userId: string;
  municipality: Municipality;
  locale: Locale;
}) {
  const query = useGetMyClubQuery(p.userId);
  const zone = p.municipality.timezone;
  return {
    query,
    when: (start: string, end: string) =>
      `${bookingDayLabel(start, zone, p.locale)} · ${timeLabel(start, zone)}–${timeLabel(end, zone)}`,
  };
}
