// SPDX-License-Identifier: AGPL-3.0-or-later
import { usePhotoGalleryController } from "./photo-gallery.controller";
// The large photo keeps its alternative text; thumbnails are buttons named after the photo they show.
export function PhotoGallery({
  photos,
  label,
  showLabel,
}: {
  photos: { id: string; url: string; alt: string }[];
  label: string;
  /** "Ver foto {n}: {alt}". */
  showLabel: (index: number, alt: string) => string;
}) {
  const c = usePhotoGalleryController(photos.length);
  const photo = photos[c.current];
  if (!photo) return null;
  return (
    <section className="photo-gallery" aria-label={label}>
      <figure>
        <img src={photo.url} alt={photo.alt} />
        <figcaption className="sr-only">{photo.alt}</figcaption>
      </figure>
      {photos.length > 1 && (
        <ul className="photo-thumbnails">
          {photos.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={index === c.current}
                aria-label={showLabel(index + 1, item.alt)}
                onClick={() => c.show(index)}
              >
                <img src={item.url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
