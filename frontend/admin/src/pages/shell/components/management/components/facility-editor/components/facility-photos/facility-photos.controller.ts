// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useAddPhotoMutation } from "@/queries/facilities/add-photo.mutation";
import { useUpdatePhotoMutation } from "@/queries/facilities/update-photo.mutation";
import { useRemovePhotoMutation } from "@/queries/facilities/remove-photo.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { FacilityPhoto } from "@/types/models";
const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
/** Photos of a facility (#26): each needs an alternative text before it is uploaded. */
export function useFacilityPhotosController(args: {
  slug: string;
  facilityId: string;
}) {
  const facilities = useListFacilitiesQuery(args.slug);
  const photos =
    facilities.data?.find((item) => item.id === args.facilityId)?.photos ?? [];
  const add = useAddPhotoMutation();
  const update = useUpdatePhotoMutation();
  const remove = useRemovePhotoMutation();
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState({ gl: "", es: "" });
  const [edits, setEdits] = useState<Record<string, FacilityPhoto["alt"]>>({});
  const [message, setMessage] = useState<{
    key: TextKey;
    error: boolean;
  } | null>(null);
  async function run(action: () => Promise<unknown>, done: TextKey) {
    setMessage(null);
    try {
      await action();
      setMessage({ key: done, error: false });
      return true;
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage({
        key:
          code === "photo_limit"
            ? "photoLimit"
            : code === "photo_too_large"
              ? "photoSizeError"
              : code === "unsupported_photo"
                ? "photoTypeError"
                : "photoError",
        error: true,
      });
      return false;
    }
  }
  function move(photo: FacilityPhoto, step: -1 | 1) {
    const index = photos.findIndex((item) => item.id === photo.id);
    if (!photos[index + step]) return;
    const order = [...photos];
    [order[index], order[index + step]] = [order[index + step], order[index]];
    // The gallery is renumbered from 0, so positions stay unique after deletions.
    void run(
      () =>
        Promise.all(
          order
            .map((item, position) => ({ ...item, position }))
            .filter(
              (item, position) =>
                photos[position]?.id !== item.id ||
                item.position !== photos[position].position,
            )
            .map((item) =>
              update.mutateAsync({ facilityId: args.facilityId, photo: item }),
            ),
        ),
      "photoMoved",
    );
  }
  return {
    photos,
    full: photos.length >= MAX_PHOTOS,
    count: photos.length,
    file,
    alt,
    message,
    pending: add.isPending || update.isPending || remove.isPending,
    chooseFile: (value: File | null) => {
      setMessage(null);
      if (value && !PHOTO_TYPES.includes(value.type)) {
        setFile(null);
        setMessage({ key: "photoTypeError", error: true });
        return;
      }
      if (value && value.size > MAX_PHOTO_BYTES) {
        setFile(null);
        setMessage({ key: "photoSizeError", error: true });
        return;
      }
      setFile(value);
    },
    setAlt: (patch: Partial<typeof alt>) =>
      setAlt((value) => ({ ...value, ...patch })),
    upload: async (event: FormEvent) => {
      event.preventDefault();
      if (!file) {
        setMessage({ key: "photoFileRequired", error: true });
        return;
      }
      if (!alt.gl.trim()) {
        setMessage({ key: "photoAltRequired", error: true });
        return;
      }
      if (
        await run(
          () =>
            add.mutateAsync({
              facilityId: args.facilityId,
              file,
              alt: { gl: alt.gl.trim(), es: alt.es.trim() },
            }),
          "photoAdded",
        )
      ) {
        setFile(null);
        setAlt({ gl: "", es: "" });
      }
    },
    altOf: (photo: FacilityPhoto) => edits[photo.id] ?? photo.alt,
    editAlt: (photo: FacilityPhoto, patch: Partial<FacilityPhoto["alt"]>) =>
      setEdits((value) => ({
        ...value,
        [photo.id]: { ...(value[photo.id] ?? photo.alt), ...patch },
      })),
    changed: (photo: FacilityPhoto) => photo.id in edits,
    saveAlt: async (photo: FacilityPhoto) => {
      const value = edits[photo.id];
      if (!value) return;
      if (!value.gl.trim()) {
        setMessage({ key: "photoAltRequired", error: true });
        return;
      }
      if (
        await run(
          () =>
            update.mutateAsync({
              facilityId: args.facilityId,
              photo: {
                ...photo,
                alt: { gl: value.gl.trim(), es: value.es.trim() },
              },
            }),
          "photoSaved",
        )
      )
        setEdits(({ [photo.id]: _, ...rest }) => rest);
    },
    moveUp: (photo: FacilityPhoto) => move(photo, -1),
    moveDown: (photo: FacilityPhoto) => move(photo, 1),
    remove: (photo: FacilityPhoto) =>
      run(
        () =>
          remove.mutateAsync({
            facilityId: args.facilityId,
            photoId: photo.id,
          }),
        "photoRemoved",
      ),
  };
}
