// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AnalyticsEvent, Municipality, Session, Locale } from "./models";
import type { TextKey } from "@/services/i18n.service";
export interface AppContext {
  municipality: Municipality;
  session: Session | null;
  locale: Locale;
  t: (key: TextKey) => string;
  signIn: () => void;
  showPrivacy: () => void;
  /** Counts a fixed event when the council has web analytics on (#57). */
  track: (event: AnalyticsEvent) => void;
}
