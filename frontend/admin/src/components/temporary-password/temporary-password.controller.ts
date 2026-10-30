// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
export function useTemporaryPasswordController(password: string) {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async () => {
      try {
        await navigator.clipboard.writeText(password);
        setCopied(true);
      } catch {
        /* Without clipboard access the password stays visible to copy by hand. */
      }
    },
  };
}
