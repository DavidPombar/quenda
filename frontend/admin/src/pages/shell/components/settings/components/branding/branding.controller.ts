// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import { useUploadLogoMutation } from "@/queries/municipality-settings/upload-logo.mutation";
import { useDeleteLogoMutation } from "@/queries/municipality-settings/delete-logo.mutation";
import {
  MIN_CONTRAST,
  brandVariables,
  contrastWithWhite,
  isHexColor,
} from "@/services/color.service";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export function useBrandingController(args: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const [color, setColorValue] = useState(args.settings.primaryColor);
  const [colorSaved, setColorSaved] = useState(false);
  const [logoError, setLogoError] = useState<TextKey | "">("");
  const [logoMessage, setLogoMessage] = useState<TextKey | "">("");
  const update = useUpdateMunicipalitySettingsMutation();
  const upload = useUploadLogoMutation();
  const remove = useDeleteLogoMutation();
  const valid = isHexColor(color);
  const ratio = valid ? contrastWithWhite(color) : 0;
  const colorError: TextKey | "" = !valid
    ? "colorFormatError"
    : ratio < MIN_CONTRAST
      ? "contrastError"
      : "";
  function setColor(value: string) {
    setColorValue(value.trim());
    setColorSaved(false);
  }
  async function saveColor(event: FormEvent) {
    event.preventDefault();
    if (colorError) {
      document
        .querySelector<HTMLElement>('#branding-form [name="primaryColor"]')
        ?.focus();
      return;
    }
    try {
      await update.mutateAsync({ primaryColor: color.toLowerCase() });
      setColorSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function uploadLogo(file: File | undefined) {
    setLogoError("");
    setLogoMessage("");
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError("logoTypeError");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("logoSizeError");
      return;
    }
    try {
      await upload.mutateAsync(file);
      setLogoMessage("logoSaved");
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function removeLogo() {
    setLogoError("");
    setLogoMessage("");
    try {
      await remove.mutateAsync();
      setLogoMessage("logoRemoved");
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    color,
    setColor,
    pickerValue: valid ? color.toLowerCase() : "#000000",
    ratio: ratio ? ratio.toFixed(2).replace(".", ",") : "—",
    colorError,
    preview: brandVariables(valid ? color : args.settings.primaryColor),
    saveColor,
    colorSaved,
    update,
    uploadLogo,
    removeLogo,
    logoError,
    logoMessage,
    upload,
    remove,
    logoServerError: upload.error?.message ?? remove.error?.message ?? "",
  };
}
