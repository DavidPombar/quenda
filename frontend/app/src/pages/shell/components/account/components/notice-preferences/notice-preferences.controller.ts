// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useGetNotificationSettingsQuery } from "@/queries/account/get-notification-settings.query";
import { useUpdatePreferencesMutation } from "@/queries/account/update-preferences.mutation";
import { useGetPushDeviceQuery } from "@/queries/account/get-push-device.query";
import { useEnablePushMutation } from "@/queries/account/enable-push.mutation";
import { useDisablePushMutation } from "@/queries/account/disable-push.mutation";
import { fill, type TextKey } from "@/services/i18n.service";
import {
  NOTICE_KINDS,
  type NoticeChannel,
  type NoticeKind,
  type NoticePreferences,
} from "@/types/models";
const KIND_LABELS: Record<NoticeKind, TextKey> = {
  confirmation: "noticeKindConfirmation",
  change: "noticeKindChange",
  cancellation: "noticeKindCancellation",
  reminder: "noticeKindReminder",
  penalty: "noticeKindPenalty",
};
/** What the device block shows, in order of precedence. */
export type DeviceState =
  | "loading"
  | "unavailable"
  | "unsupported"
  | "ios_home_screen"
  | "denied"
  | "active"
  | "off";
export function useNoticePreferencesController(args: {
  userId: string;
  hasEmail: boolean;
  reminderHours: number;
  t: (key: TextKey) => string;
}) {
  const settings = useGetNotificationSettingsQuery(args.userId);
  const save = useUpdatePreferencesMutation();
  const device = useGetPushDeviceQuery();
  const enable = useEnablePushMutation();
  const disable = useDisablePushMutation();
  // Edits are kept apart from the server copy until they are saved.
  const [draft, setDraft] = useState<NoticePreferences | null>(null);
  const choices = draft ?? settings.data?.preferences;
  const push = settings.data?.push;
  const deviceState: DeviceState =
    !push || device.isPending
      ? "loading"
      : !push.available
        ? "unavailable"
        : device.data?.support === "unsupported" || device.isError
          ? "unsupported"
          : device.data?.support === "ios_home_screen"
            ? "ios_home_screen"
            : device.data?.permission === "denied"
              ? "denied"
              : device.data?.endpoint
                ? "active"
                : "off";
  return {
    settings,
    rows: NOTICE_KINDS.map((kind) => ({
      kind,
      label: args.t(KIND_LABELS[kind]),
      hint:
        kind === "reminder"
          ? fill(args.t("reminderHint"), { hours: args.reminderHours })
          : null,
      email: choices?.[kind].email ?? false,
      push: choices?.[kind].push ?? false,
    })),
    hasEmail: args.hasEmail,
    toggle(kind: NoticeKind, channel: NoticeChannel, value: boolean) {
      if (!choices) return;
      save.reset();
      setDraft({ ...choices, [kind]: { ...choices[kind], [channel]: value } });
    },
    async submit() {
      if (!choices) return;
      try {
        await save.mutateAsync(choices);
        setDraft(null);
      } catch {
        /* Mutation state presents the error. */
      }
    },
    save,
    deviceState,
    enable: () => {
      if (push?.publicKey) enable.mutate(push.publicKey);
    },
    disable: () => disable.mutate(),
    deviceBusy: enable.isPending || disable.isPending,
    deviceError: enable.isError || disable.isError,
  };
}
