// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  MunicipalitySettings,
  SettingsPatch,
  SettingsUpdate,
} from "@/types/models";
export const municipalitySettingsRepository = {
  get: () => apiClient.request<MunicipalitySettings>("manager/municipality"),
  update: (patch: SettingsPatch) =>
    apiClient.request<SettingsUpdate>("manager/municipality", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  uploadLogo: (file: File) =>
    apiClient.request<void>("manager/municipality/logo", {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  uploadIcon: (icon: Blob) =>
    apiClient.request<void>("manager/municipality/icon", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: icon,
    }),
  deleteLogo: () =>
    apiClient.request<void>("manager/municipality/logo", {
      method: "DELETE",
    }),
};
