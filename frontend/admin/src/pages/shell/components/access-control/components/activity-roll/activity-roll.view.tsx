// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiCheckSquare } from "react-icons/pi";
import { timeLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { AccessSession, Locale } from "@/types/models";
import { useActivityRollController } from "./activity-roll.controller";
/** Roll call of today's activity sessions at the gate (#97, part D). */
export function ActivityRoll(p: {
  sessions: AccessSession[];
  slug: string;
  staff: boolean;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useActivityRollController(p);
  const { t } = p;
  return (
    <section aria-labelledby="activity-roll-title">
      <h2 id="activity-roll-title">{t("rollTitle")}</h2>
      {c.pending > 0 && (
        <p role="status" className="notice">
          {fill(t("rollPending"), { count: c.pending })}
        </p>
      )}
      {c.conflicts.map((message) => (
        <p key={message} role="alert" className="error-text">
          {message}
        </p>
      ))}
      {p.sessions.length === 0 ? (
        <p className="muted">{t("rollEmpty")}</p>
      ) : (
        p.sessions.map((session) => {
          const name =
            session.activityName[p.locale] || session.activityName.gl;
          const titleId = `roll-${session.id}`;
          const unmarked = session.people.some(
            (person) => c.statusOf(session, person.enrolmentId) === null,
          );
          return (
            <article
              key={session.id}
              className="roll-session"
              aria-labelledby={titleId}
            >
              <h3 id={titleId}>
                {timeLabel(session.start, p.timezone)}–
                {timeLabel(session.end, p.timezone)} · {name}
              </h3>
              <p className="muted">
                {session.facilityName}, {session.resourceName}.{" "}
                {fill(t("rollPresentCount"), {
                  present: c.present(session),
                  total: session.people.length,
                })}
              </p>
              {c.early === session.id && (
                <p role="alert" className="error-text">
                  {fill(t("rollTooEarly"), {
                    time: timeLabel(session.validFrom, p.timezone),
                  })}
                </p>
              )}
              {session.people.length === 0 ? (
                <p className="muted">{t("rollNobody")}</p>
              ) : (
                <>
                  {unmarked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => c.markAll(session)}
                    >
                      <PiCheckSquare size={18} aria-hidden="true" />
                      {t("rollAllPresent")}
                    </Button>
                  )}
                  <ul className="roll-list">
                    {session.people.map((person) => {
                      const status = c.statusOf(session, person.enrolmentId);
                      const group = `roll-${session.id}-${person.enrolmentId}`;
                      return (
                        <li key={person.enrolmentId}>
                          <fieldset className="roll-person">
                            <legend>{person.name}</legend>
                            {(["present", "absent"] as const).map((value) => (
                              <label key={value} className="checkbox-field">
                                <input
                                  type="radio"
                                  name={group}
                                  value={value}
                                  checked={status === value}
                                  onChange={() =>
                                    c.mark(session, person.enrolmentId, value)
                                  }
                                />
                                {t(
                                  value === "present"
                                    ? "rollPresent"
                                    : "rollAbsent",
                                )}
                              </label>
                            ))}
                          </fieldset>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
