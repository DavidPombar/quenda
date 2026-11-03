// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiCalendarX,
  PiChalkboardTeacher,
  PiHourglassMedium,
  PiMapPin,
  PiUser,
} from "react-icons/pi";
import { ROUTES, routeFor } from "@/constants/routes";
import { localized } from "@/services/catalog.service";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import { distinctResource } from "@/services/resources.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type {
  EnrolmentStatus,
  Locale,
  Municipality,
  MyEnrolment,
} from "@/types/models";
const STATUS: Record<EnrolmentStatus, TextKey> = {
  enrolled: "enrolmentEnrolled",
  waiting: "enrolmentWaiting",
  left: "enrolmentLeft",
  removed: "enrolmentRemoved",
  cancelled: "enrolmentCancelled",
};
/** One enrolment of the person in an activity (#97): their place, or their turn in the queue. */
export function EnrolmentRow(p: {
  enrolment: MyEnrolment;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  leaving: boolean;
  onLeave: () => void;
}) {
  const e = p.enrolment;
  const zone = p.municipality.timezone;
  const open = e.status === "enrolled" || e.status === "waiting";
  const resource = distinctResource(e.facilityName, e.resourceName);
  return (
    <article className="booking-row enrolment-row">
      <div className="booking-title">
        <h2>
          <Link
            to={routeFor(
              p.municipality.slug,
              `${ROUTES.activities}/${e.activityId}`,
            )}
          >
            {localized(e.activityName, p.locale)}
          </Link>
        </h2>
        <span
          className={`booking-status ${
            e.status === "enrolled"
              ? "upcoming"
              : e.status === "waiting"
                ? "waiting"
                : "cancelled"
          }`}
        >
          {e.status === "waiting" ? (
            <PiHourglassMedium size={18} aria-hidden="true" />
          ) : (
            <PiChalkboardTeacher size={18} aria-hidden="true" />
          )}
          {fill(p.t(STATUS[e.status]), { position: e.position ?? "" })}
        </span>
      </div>
      <ul className="meta-list">
        {e.participant && (
          <li>
            <PiUser size={20} aria-hidden="true" />
            {fill(p.t("enrolmentParticipant"), {
              name: e.participant.firstName,
            })}
          </li>
        )}
        <li>
          <PiMapPin size={20} aria-hidden="true" />
          {resource ? `${e.facilityName}, ${resource}` : e.facilityName}
        </li>
        {open && e.nextSession && (
          <li>
            <PiCalendarBlank size={20} aria-hidden="true" />
            {fill(p.t("enrolmentNext"), {
              date: `${bookingDayLabel(e.nextSession, zone, p.locale)}, ${timeLabel(e.nextSession, zone)}`,
            })}
          </li>
        )}
        {open && e.cancelledSessions > 0 && (
          <li>
            <PiCalendarX size={20} aria-hidden="true" />
            {fill(p.t("enrolmentCancelledSessions"), {
              count: e.cancelledSessions,
            })}
          </li>
        )}
      </ul>
      {open && (
        <div className="booking-actions">
          <Button
            variant="outline"
            onClick={p.onLeave}
            loading={p.leaving}
            aria-label={
              e.participant
                ? `${p.t("enrolLeave")}: ${e.participant.firstName}`
                : undefined
            }
          >
            {p.t("enrolLeave")}
          </Button>
        </div>
      )}
    </article>
  );
}
