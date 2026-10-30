// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
export function usePhotoGalleryController(count: number) {
  const [chosen, setChosen] = useState(0);
  return { current: Math.min(chosen, Math.max(0, count - 1)), show: setChosen };
}
