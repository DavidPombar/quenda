// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  AnalyticsForwarder,
  PageView,
} from "../application/analytics-forwarder";
const TIMEOUT_MS = 3000;
/** Umami's collection API (`POST /api/send`), the same call its own tracker script makes. */
@Injectable()
export class FetchAnalyticsForwarder extends AnalyticsForwarder {
  accepts(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (parsed.username || parsed.password) return false;
    if (parsed.protocol === "https:") return true;
    // Plain HTTP only to a local Umami (`npm run analytics:up`, the e2e tests), never in production.
    return (
      process.env.NODE_ENV !== "production" &&
      parsed.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(parsed.hostname)
    );
  }
  async send(view: PageView) {
    if (!this.accepts(view.url)) throw new Error("analytics URL not allowed");
    const response = await fetch(`${view.url}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": view.userAgent,
        "X-Forwarded-For": view.ip,
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: view.websiteId,
          hostname: view.hostname,
          url: view.path,
          language: view.language,
          screen: view.screen,
          referrer: "",
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`umami answered ${response.status}`);
  }
}
