// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  Facility,
  FacilityImpact,
  FacilityPhoto,
  Resource,
  ResourceDraft,
} from "@/types/models";
export const facilitiesRepository = {
  list: () => apiClient.request<Facility[]>("manager/facilities"),
  /** The image is the raw body; its required alternative text travels in the query. */
  addPhoto: (args: {
    facilityId: string;
    file: File;
    alt: { gl: string; es: string };
  }) =>
    apiClient.request<{ id: string }>(
      `manager/facilities/${args.facilityId}/photos?${new URLSearchParams({ altGl: args.alt.gl, altEs: args.alt.es })}`,
      {
        method: "POST",
        body: args.file,
        headers: { "Content-Type": args.file.type },
      },
    ),
  updatePhoto: (args: {
    facilityId: string;
    photo: Pick<FacilityPhoto, "id" | "alt" | "position">;
  }) =>
    apiClient.request<void>(
      `manager/facilities/${args.facilityId}/photos/${args.photo.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          alt: args.photo.alt,
          position: args.photo.position,
        }),
      },
    ),
  removePhoto: (args: { facilityId: string; photoId: string }) =>
    apiClient.request<void>(
      `manager/facilities/${args.facilityId}/photos/${args.photoId}`,
      { method: "DELETE" },
    ),
  saveResources: (args: { facilityId: string; resources: ResourceDraft[] }) =>
    apiClient.request<Resource[]>(
      `manager/facilities/${args.facilityId}/resources`,
      { method: "PUT", body: JSON.stringify({ resources: args.resources }) },
    ),
  impact: (id: string) =>
    apiClient.request<FacilityImpact>(`manager/facilities/${id}/impact`),
  save: (args: {
    facility: Facility;
    isNew: boolean;
    /** Cancels upcoming bookings with this reason when closing. */
    closureReason?: string;
  }) =>
    apiClient.request<Facility | void>(
      `manager/facilities${args.isNew ? "" : `/${args.facility.id}`}`,
      {
        method: args.isNew ? "POST" : "PATCH",
        body: JSON.stringify(
          args.isNew
            ? { id: args.facility.id, ...editable(args.facility) }
            : { ...editable(args.facility), closureReason: args.closureReason },
        ),
      },
    ),
};
/**
 * Only the fields the API accepts: the public listing also returns read-only data such as the
 * courts, and the API rejects unknown properties.
 */
function editable(facility: Facility) {
  return {
    name: facility.name,
    sport: facility.sport,
    address: facility.address,
    description: facility.description,
    accessible: facility.accessible,
    status: facility.status,
    slotMinutes: facility.slotMinutes,
    priceCents: facility.priceCents,
    prices: facility.prices,
    openingCalendar: facility.openingCalendar,
    rules: facility.rules,
    followsMunicipalHolidays: facility.followsMunicipalHolidays,
    latitude: facility.latitude,
    longitude: facility.longitude,
  };
}
