// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import {
  DATA_LICENSES,
  type DataLicense,
  type MunicipalitySettings,
} from "@/types/models";
const DIR3 = /^[A-Za-z0-9]{9}$/;
/** Licence and publisher of the municipality's open data (T3, #21). */
export function useOpenDataController(args: {
  settings: MunicipalitySettings;
}) {
  const [license, setLicenseValue] = useState<DataLicense>(
    args.settings.dataLicense,
  );
  const [dir3, setDir3Value] = useState(args.settings.dir3Code ?? "");
  const [dir3Invalid, setDir3Invalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  async function save(event: FormEvent) {
    event.preventDefault();
    const code = dir3.trim();
    if (code && !DIR3.test(code)) {
      setDir3Invalid(true);
      document
        .querySelector<HTMLElement>('#open-data-form [name="dir3Code"]')
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({
        dataLicense: license,
        dir3Code: code ? code.toUpperCase() : null,
      });
      setDir3Value(code.toUpperCase());
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    licenses: DATA_LICENSES,
    license,
    setLicense: (value: string) => {
      setLicenseValue(
        DATA_LICENSES.find((item) => item === value) ?? DATA_LICENSES[0],
      );
      setSaved(false);
    },
    dir3,
    setDir3: (value: string) => {
      setDir3Value(value);
      setDir3Invalid(false);
      setSaved(false);
    },
    dir3Invalid,
    save,
    saved,
    mutation,
  };
}
