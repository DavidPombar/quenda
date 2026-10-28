// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Locale, OperatorSession } from "./models";
import type { TextKey } from "@/services/i18n.service";
export interface OperatorContext {
  session: OperatorSession;
  locale: Locale;
  t: (key: TextKey) => string;
}
