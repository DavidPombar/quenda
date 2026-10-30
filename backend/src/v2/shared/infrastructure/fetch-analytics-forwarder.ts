// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AnalyticsConfig } from "../application/analytics-config";
import {
  AnalyticsForwarder,
  PageView,
} from "../application/analytics-forwarder";
const TIMEOUT_MS = 3000;
/** Umami's collection API (`POST /api/send`), the same call its own tracker script makes. */
@Injectable()
export class FetchAnalyticsForwarder extends AnalyticsForwarder {
  constructor(private readonly config: AnalyticsConfig) {
    super();
  }
  async send(view: PageView) {
    const umami = this.config.umami();
    const website = umami?.websites[view.app];
    if (!umami || !website) throw new Error("analytics is not configured");
    const response = await fetch(`${umami.url}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": view.userAgent,
        "X-Forwarded-For": view.ip,
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website,
          hostname: view.hostname,
          url: view.path,
          language: view.language,
          screen: view.screen,
          referrer: "",
          ...(view.tag ? { tag: view.tag } : {}),
          ...(view.event ? { name: view.event } : {}),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`umami answered ${response.status}`);
  }
}
