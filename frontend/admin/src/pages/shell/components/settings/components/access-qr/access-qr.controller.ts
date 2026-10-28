// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { useGetAccessSettingsQuery } from "@/queries/access/get-access-settings.query";
import { useRotateAccessKeyMutation } from "@/queries/access/rotate-access-key.mutation";
import { useUpdateAccessWebhookMutation } from "@/queries/access/update-access-webhook.mutation";
const URL_PATTERN = /^https?:\/\/\S+$/;
export function useAccessQrController(p: { tenantId: string }) {
  const settings = useGetAccessSettingsQuery(p.tenantId);
  const rotate = useRotateAccessKeyMutation();
  const update = useUpdateAccessWebhookMutation();
  const [confirming, setConfirming] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [rotateSecret, setRotateSecret] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const current = url ?? settings.data?.webhookUrl ?? "";
  async function save(event: FormEvent) {
    event.preventDefault();
    const value = current.trim();
    if (value && !URL_PATTERN.test(value)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    try {
      await update.mutateAsync({ url: value, rotateSecret });
      setRotateSecret(false);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    settings,
    activeKey: settings.data?.keys.find((key) => !key.retiredAt) ?? null,
    rotate,
    confirming,
    askRotate: () => {
      rotate.reset();
      setConfirming(true);
    },
    cancelRotate: () => setConfirming(false),
    confirmRotate: () =>
      rotate.mutate(undefined, { onSuccess: () => setConfirming(false) }),
    url: current,
    setUrl,
    rotateSecret,
    setRotateSecret,
    invalid,
    update,
    secret: update.data?.secret ?? null,
    save,
  };
}
