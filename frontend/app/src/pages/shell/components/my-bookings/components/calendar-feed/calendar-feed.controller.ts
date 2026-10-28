// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useGetCalendarFeedQuery } from "@/queries/calendar-feeds/get-calendar-feed.query";
import { useRotateCalendarFeedMutation } from "@/queries/calendar-feeds/rotate-calendar-feed.mutation";
import { useRevokeCalendarFeedMutation } from "@/queries/calendar-feeds/revoke-calendar-feed.mutation";
export function useCalendarFeedController(userId: string) {
  const feed = useGetCalendarFeedQuery(userId);
  const rotate = useRotateCalendarFeedMutation();
  const revoke = useRevokeCalendarFeedMutation();
  const [copied, setCopied] = useState(false);
  // The secret is only known right after issuing it; it is never refetched.
  const httpsUrl = rotate.data
    ? new URL(rotate.data.path, window.location.origin).toString()
    : null;
  const webcalUrl = httpsUrl?.replace(/^https?:/, "webcal:") ?? null;
  async function issue() {
    setCopied(false);
    revoke.reset();
    try {
      await rotate.mutateAsync();
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function remove() {
    setCopied(false);
    rotate.reset();
    try {
      await revoke.mutateAsync();
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function copy() {
    if (!httpsUrl) return;
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
    } catch {
      /* The URL stays selectable in the text field. */
    }
  }
  return {
    feed,
    active: !!httpsUrl || !!feed.data?.active,
    httpsUrl,
    webcalUrl,
    copied,
    busy: rotate.isPending || revoke.isPending,
    error: rotate.error ?? revoke.error,
    issue,
    remove,
    copy,
  };
}
