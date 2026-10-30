// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { AnalyticsConfig, UmamiAccess } from "../application/analytics-config";
/**
 * Umami only over HTTPS. Plain HTTP is accepted to a local Umami outside production
 * (`npm run analytics:up`) and in the demo, which talks to its `umami` container over HTTP.
 */
export function allowedUmamiUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;
  if (process.env.DEMO_MODE === "true") return true;
  return (
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost"].includes(url.hostname)
  );
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
@Injectable()
export class EnvAnalyticsConfig extends AnalyticsConfig {
  private readonly access: UmamiAccess | null;
  private readonly timezone =
    process.env.DEPLOYMENT_TIMEZONE || "Europe/Madrid";
  constructor() {
    super();
    const url = (process.env.UMAMI_URL ?? "").replace(/\/+$/, "");
    const website = (name: string) => {
      const value = process.env[name] ?? "";
      return UUID.test(value) ? value.toLowerCase() : null;
    };
    if (!url) this.access = null;
    else if (!allowedUmamiUrl(url)) {
      new Logger(EnvAnalyticsConfig.name).warn(
        "UMAMI_URL must be an https address; web analytics stays off",
      );
      this.access = null;
    } else
      this.access = {
        url,
        websites: {
          app: website("UMAMI_APP_WEBSITE_ID"),
          web: website("UMAMI_WEB_WEBSITE_ID"),
        },
        reader:
          process.env.UMAMI_USERNAME && process.env.UMAMI_PASSWORD
            ? {
                username: process.env.UMAMI_USERNAME,
                password: process.env.UMAMI_PASSWORD,
              }
            : null,
      };
  }
  umami() {
    return this.access;
  }
  deploymentTimezone() {
    return this.timezone;
  }
}
