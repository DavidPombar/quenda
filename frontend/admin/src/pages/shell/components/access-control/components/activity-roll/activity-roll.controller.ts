// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { onlineManager } from "@tanstack/react-query";
import { Temporal } from "@js-temporal/polyfill";
import { useRecordAttendanceMutation } from "@/queries/access/record-attendance.mutation";
import {
  pendingAttendance,
  storePendingAttendance,
} from "@/services/access-store.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type {
  AccessSession,
  AttendanceMark,
  AttendanceOutcome,
  AttendanceStatus,
} from "@/types/models";
const REJECTIONS = {
  cancelled: "rollReasonCancelled",
  not_enrolled: "rollReasonNotEnrolled",
  out_of_window: "rollReasonWindow",
  not_found: "rollReasonNotFound",
} as const satisfies Partial<Record<AttendanceOutcome, TextKey>>;
const key = (sessionId: string, enrolmentId: string) =>
  `${sessionId}:${enrolmentId}`;
/**
 * The roll of today's activity sessions (#97, part D): marks are kept on the device and sent at
 * once, or as soon as it is back on the network; the latest mark per person wins.
 */
export function useActivityRollController(p: {
  sessions: AccessSession[];
  slug: string;
  staff: boolean;
  t: (key: TextKey) => string;
}) {
  const record = useRecordAttendanceMutation();
  const [pending, setPending] = useState<AttendanceMark[]>(() =>
    pendingAttendance(p.slug),
  );
  const queue = useRef(pending);
  const syncing = useRef(false);
  const again = useRef(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [early, setEarly] = useState<string | null>(null);
  function remember(items: AttendanceMark[]) {
    queue.current = items;
    setPending(items);
    storePendingAttendance(p.slug, items);
  }
  async function flush() {
    if (!queue.current.length) return;
    if (syncing.current) {
      again.current = true;
      return;
    }
    syncing.current = true;
    const batch = queue.current.slice(0, 200);
    let delivered = false;
    try {
      const { results } = await record.mutateAsync(batch);
      const names = new Map(
        p.sessions.flatMap((session) =>
          session.people.map((person) => [
            key(session.id, person.enrolmentId),
            person.name,
          ]),
        ),
      );
      setConflicts(
        results.flatMap(({ sessionId, enrolmentId, outcome }) =>
          outcome in REJECTIONS
            ? [
                fill(p.t("rollConflict"), {
                  name: names.get(key(sessionId, enrolmentId)) ?? "",
                  reason: p.t(REJECTIONS[outcome as keyof typeof REJECTIONS]),
                }),
              ]
            : [],
        ),
      );
      const sent = new Set(
        batch.map(
          (item) =>
            `${key(item.sessionId, item.enrolmentId)}:${item.recordedAt}`,
        ),
      );
      remember(
        queue.current.filter(
          (item) =>
            !sent.has(
              `${key(item.sessionId, item.enrolmentId)}:${item.recordedAt}`,
            ),
        ),
      );
      delivered = true;
    } catch {
      /* Offline: the marks stay on the device for the next attempt. */
    } finally {
      syncing.current = false;
    }
    const retry = again.current;
    again.current = false;
    if ((delivered || retry) && queue.current.length) await flush();
  }
  const latestFlush = useRef(flush);
  latestFlush.current = flush;
  useEffect(
    () =>
      onlineManager.subscribe((online) => {
        if (online && p.staff) void latestFlush.current();
      }),
    [p.staff],
  );
  // What the device shows: its own unsent marks over what the server last said.
  const local = new Map(
    pending.map((item) => [key(item.sessionId, item.enrolmentId), item.status]),
  );
  const statusOf = (session: AccessSession, enrolmentId: string) =>
    local.get(key(session.id, enrolmentId)) ??
    session.people.find((person) => person.enrolmentId === enrolmentId)
      ?.attendance ??
    null;
  function mark(
    session: AccessSession,
    enrolmentIds: string[],
    status: AttendanceStatus,
  ) {
    const now = Temporal.Now.instant();
    if (
      Temporal.Instant.compare(now, Temporal.Instant.from(session.validFrom)) <
      0
    ) {
      setEarly(session.id);
      return;
    }
    setEarly(null);
    const at = now.toString();
    const marked = new Set(enrolmentIds.map((id) => key(session.id, id)));
    remember([
      ...queue.current.filter(
        (item) => !marked.has(key(item.sessionId, item.enrolmentId)),
      ),
      ...enrolmentIds.map((enrolmentId) => ({
        sessionId: session.id,
        enrolmentId,
        status,
        recordedAt: at,
      })),
    ]);
    void flush();
  }
  return {
    conflicts,
    early,
    pending: pending.length,
    statusOf,
    present: (session: AccessSession) =>
      session.people.filter(
        (person) => statusOf(session, person.enrolmentId) === "present",
      ).length,
    mark: (
      session: AccessSession,
      enrolmentId: string,
      status: AttendanceStatus,
    ) => mark(session, [enrolmentId], status),
    markAll: (session: AccessSession) =>
      mark(
        session,
        session.people
          .filter((person) => statusOf(session, person.enrolmentId) === null)
          .map((person) => person.enrolmentId),
        "present",
      ),
  };
}
