// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useWebAnalytics } from "@/queries/analytics/web-analytics.query";
import { copy, type Locale } from "@/services/i18n.service";
export function useHomeController() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  useWebAnalytics(locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy[locale].documentTitle;
  }, [locale]);
  function selectLocale(value: Locale) {
    localStorage.setItem("quenda.locale", value);
    setLocale(value);
  }
  return { locale, selectLocale, t: copy[locale] };
}
