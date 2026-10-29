// SPDX-License-Identifier: AGPL-3.0-or-later
import type { TextKey } from "@/services/i18n.service";
import type { Locale, Municipality } from "@/types/models";
import { useMyClubController } from "./my-club.controller";
/** Shown only to people who represent a club (#17). */
export function MyClub(p: {
  userId: string;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useMyClubController(p);
  const club = c.query.data;
  if (!club?.organization) return null;
  return (
    <section className="account-section" aria-labelledby="my-club-title">
      <h2 id="my-club-title">
        {p.t("myClub")}: {club.organization.name}
      </h2>
      <p>{p.t("myClubBody")}</p>
      {club.occurrences.length === 0 ? (
        <p className="muted">{p.t("myClubEmpty")}</p>
      ) : (
        <ul className="club-slots">
          {club.occurrences.map((slot) => (
            <li key={slot.id}>
              <strong>{c.when(slot.start, slot.end)}</strong>
              <span className="muted">
                {slot.facilityName} · {slot.resourceName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
