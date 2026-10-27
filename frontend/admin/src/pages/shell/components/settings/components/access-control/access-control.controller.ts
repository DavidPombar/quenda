// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useGetAccessSettingsQuery } from "@/queries/access/get-access-settings.query";
import { useRotateKeyMutation } from "@/queries/access/rotate-key.mutation";
import { useConfigureWebhookMutation } from "@/queries/access/configure-webhook.mutation";
import { dateLabel } from "@/services/date.service";
import type { Locale } from "@/types/models";
/** Access control settings (M3): the municipal signing key and the open webhook. */
export function useAccessControlController(args: {
  tenantId: string;
  timezone: string;
  locale: Locale;
}) {
  const settings = useGetAccessSettingsQuery(args.tenantId);
  const rotate = useRotateKeyMutation();
  const configure = useConfigureWebhookMutation();
  const [confirming, setConfirming] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const current = settings.data?.webhookUrl ?? "";
  useEffect(() => setUrl(current), [current]);
  async function rotateKey() {
    try {
      await rotate.mutateAsync();
      setRotated(true);
      setConfirming(false);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function saveWebhook(event: FormEvent, rotateSecret = false) {
    event.preventDefault();
    setSaved(false);
    try {
      const result = await configure.mutateAsync({
        url: url.trim() || null,
        rotateSecret,
      });
      setSecret(result.secret);
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    settings,
    keyCreated: settings.data
      ? dateLabel(settings.data.key.createdAt, args.timezone, args.locale)
      : "",
    rotate,
    confirming,
    setConfirming: (value: boolean) => {
      rotate.reset();
      setConfirming(value);
    },
    rotated,
    rotateKey,
    configure,
    url,
    setUrl: (value: string) => {
      setUrl(value);
      setSaved(false);
    },
    secret,
    saved,
    saveWebhook,
  };
}
