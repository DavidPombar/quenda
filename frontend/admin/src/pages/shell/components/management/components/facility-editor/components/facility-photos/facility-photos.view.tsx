// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import {
  PiArrowDown,
  PiArrowUp,
  PiTrash,
  PiUploadSimple,
} from "react-icons/pi";
import { fill, type TextKey } from "@/services/i18n.service";
import {
  useFacilityPhotosController,
  MAX_PHOTOS,
} from "./facility-photos.controller";
// Photos are only offered for saved facilities; every photo carries an alternative text (T5).
export function FacilityPhotos(p: {
  slug: string;
  facilityId: string;
  t: (key: TextKey) => string;
}) {
  const c = useFacilityPhotosController(p);
  const { t } = p;
  return (
    <section className="facility-photos" aria-labelledby="photos-title">
      <h3 id="photos-title">{t("photosSection")}</h3>
      <p className="field-hint">
        {fill(t("photosCount"), { count: c.count, max: MAX_PHOTOS })}
      </p>
      {c.message && (
        <p
          role={c.message.error ? "alert" : "status"}
          className={c.message.error ? "error-text" : "success-message"}
        >
          {t(c.message.key)}
        </p>
      )}
      {c.photos.length > 0 && (
        <ul className="photo-list">
          {c.photos.map((photo, index) => {
            const alt = c.altOf(photo);
            return (
              <li key={photo.id}>
                <img src={photo.url} alt={photo.alt.gl} />
                <div className="photo-fields">
                  <Field.Root className="field" required>
                    <Field.Label>
                      {t("photoAltGl")} <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      size="sm"
                      maxLength={250}
                      value={alt.gl}
                      onChange={(event) =>
                        c.editAlt(photo, { gl: event.target.value })
                      }
                    />
                  </Field.Root>
                  <Field.Root className="field">
                    <Field.Label>{t("photoAltEs")}</Field.Label>
                    <Input
                      size="sm"
                      maxLength={250}
                      value={alt.es}
                      onChange={(event) =>
                        c.editAlt(photo, { es: event.target.value })
                      }
                    />
                  </Field.Root>
                </div>
                <div className="photo-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!c.changed(photo) || c.pending}
                    onClick={() => {
                      void c.saveAlt(photo);
                    }}
                  >
                    {t("save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={fill(t("photoMoveUp"), { n: index + 1 })}
                    disabled={index === 0 || c.pending}
                    onClick={() => c.moveUp(photo)}
                  >
                    <PiArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={fill(t("photoMoveDown"), { n: index + 1 })}
                    disabled={index === c.photos.length - 1 || c.pending}
                    onClick={() => c.moveDown(photo)}
                  >
                    <PiArrowDown aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={fill(t("photoRemove"), { n: index + 1 })}
                    disabled={c.pending}
                    onClick={() => {
                      void c.remove(photo);
                    }}
                  >
                    <PiTrash aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!c.full && (
        <form
          className="photo-upload"
          aria-label={t("photoAdd")}
          noValidate
          onSubmit={(event) => {
            void c.upload(event);
          }}
        >
          <label className="upload-calendar">
            <PiUploadSimple size={18} aria-hidden="true" />
            {c.file ? c.file.name : t("photoChoose")}
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                c.chooseFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          <Field.Root className="field" required>
            <Field.Label>
              {t("photoAltGl")} <Field.RequiredIndicator />
            </Field.Label>
            <Input
              maxLength={250}
              value={c.alt.gl}
              onChange={(event) => c.setAlt({ gl: event.target.value })}
            />
            <Field.HelperText>{t("photoAltHint")}</Field.HelperText>
          </Field.Root>
          <Field.Root className="field">
            <Field.Label>{t("photoAltEs")}</Field.Label>
            <Input
              maxLength={250}
              value={c.alt.es}
              onChange={(event) => c.setAlt({ es: event.target.value })}
            />
          </Field.Root>
          <Button type="submit" colorPalette="court" loading={c.pending}>
            {t("photoAdd")}
          </Button>
        </form>
      )}
    </section>
  );
}
