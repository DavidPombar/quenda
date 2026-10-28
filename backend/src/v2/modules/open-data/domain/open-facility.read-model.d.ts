// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "../../facilities/domain/facility.entity";
import type {
  DataLicense,
  MunicipalitySettings,
} from "../../../shared/application/municipality-settings";
/** Public facility fields published as open data; no booking or personal data. */
export interface OpenFacility extends Pick<
  Facility,
  | "id"
  | "name"
  | "sport"
  | "address"
  | "description"
  | "accessible"
  | "status"
  | "slotMinutes"
  | "priceCents"
  | "latitude"
  | "longitude"
> {
  /** Active courts or spaces; the parts of a divisible court are not counted separately. */
  courts: number;
}
export interface OpenFacilities {
  municipality: Pick<MunicipalitySettings, "slug" | "name" | "dir3Code"> & {
    dataLicense: DataLicense;
  };
  facilities: OpenFacility[];
  /** Local date (YYYY-MM-DD) the publication was generated, in the municipality time zone. */
  generatedOn: string;
}
