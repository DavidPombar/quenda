// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Municipality, Session, Locale } from "./models";
import type { TextKey } from "@/services/i18n.service";
export interface AppContext {
  municipality: Municipality;
  session: Session | null;
  locale: Locale;
  t: (key: TextKey) => string;
  signIn: () => void;
  showPrivacy: () => void;
}
