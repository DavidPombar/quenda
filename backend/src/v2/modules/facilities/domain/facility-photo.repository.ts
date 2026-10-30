// SPDX-License-Identifier: AGPL-3.0-or-later
import type { FacilityPhoto } from "./facility-photo.entity";
import type { LogoType } from "../../municipalities/domain/logo";
export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export abstract class FacilityPhotoRepository {
  /** Photos of the given facilities, ordered by position and creation. */
  abstract list(
    tenantId: string,
    facilityIds: readonly string[],
  ): Promise<FacilityPhoto[]>;
  abstract add(
    tenantId: string,
    photo: Omit<FacilityPhoto, "version">,
    data: Uint8Array,
  ): Promise<void>;
  abstract update(
    tenantId: string,
    id: string,
    changes: { alt: { gl: string; es: string }; position: number },
  ): Promise<boolean>;
  abstract remove(
    tenantId: string,
    facilityId: string,
    id: string,
  ): Promise<boolean>;
  /** Image bytes for the public URL; null when the photo does not exist. */
  abstract image(
    facilityId: string,
    id: string,
  ): Promise<{
    contentType: LogoType;
    data: Uint8Array;
    version: string;
  } | null>;
}
