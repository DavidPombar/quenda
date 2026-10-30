// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  AnalyticsReader,
  MetricType,
  ReadRange,
} from "../../application/analytics-reader";
import { AnalyticsConfig } from "../../../../shared/application/analytics-config";
import type {
  Ranked,
  UmamiTotals,
} from "../../domain/web-analytics.read-model";
const TIMEOUT_MS = 5000;
const LIST_LIMIT = 50;
/**
 * Umami's REST API with the read-only user of the deployment. The token lives in memory and is
 * renewed once when Umami answers 401 (expired or Umami restarted).
 */
@Injectable()
export class UmamiApiReader extends AnalyticsReader {
  private token: Promise<string> | null = null;
  constructor(private readonly config: AnalyticsConfig) {
    super();
  }
  async totals(website: string, range: ReadRange, tag: string | null) {
    const body = await this.get<Partial<Record<keyof UmamiTotals, unknown>>>(
      `websites/${website}/stats`,
      this.query(range, tag),
    );
    const number = (value: unknown) =>
      typeof value === "number"
        ? value
        : // Umami v2 wraps each total as { value, prev }; newer versions send plain numbers.
          typeof value === "object" && value && "value" in value
          ? Number((value as { value: unknown }).value) || 0
          : 0;
    return {
      pageviews: number(body.pageviews),
      visitors: number(body.visitors),
      visits: number(body.visits),
      bounces: number(body.bounces),
      totaltime: number(body.totaltime),
    };
  }
  async metric(
    website: string,
    type: MetricType,
    range: ReadRange,
    tag: string | null,
  ): Promise<Ranked[]> {
    const rows = await this.get<{ x: string | null; y: number }[]>(
      `websites/${website}/metrics`,
      { ...this.query(range, tag), type, limit: String(LIST_LIMIT) },
    );
    return rows.map((row) => ({ value: row.x ?? "", count: row.y }));
  }
  private query(range: ReadRange, tag: string | null): Record<string, string> {
    return {
      startAt: String(range.startAt),
      endAt: String(range.endAt),
      ...(tag ? { tag } : {}),
    };
  }
  private async get<T>(path: string, query: Record<string, string>) {
    const umami = this.config.umami();
    if (!umami?.reader) throw new Error("Umami reading is not configured");
    const url = `${umami.url}/api/${path}?${new URLSearchParams(query)}`;
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${await this.login()}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
      });
      if (response.status === 401 && attempt === 0) {
        this.token = null;
        continue;
      }
      if (!response.ok) throw new Error(`umami answered ${response.status}`);
      return (await response.json()) as T;
    }
  }
  private login() {
    if (!this.token) {
      const umami = this.config.umami();
      if (!umami?.reader) throw new Error("Umami reading is not configured");
      const reader = umami.reader;
      this.token = fetch(`${umami.url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reader),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
      }).then(async (response) => {
        if (!response.ok)
          throw new Error(`umami login answered ${response.status}`);
        const { token } = (await response.json()) as { token?: string };
        if (!token) throw new Error("umami login returned no token");
        return token;
      });
      // A failed login is not kept, so the next request tries again.
      this.token.catch(() => (this.token = null));
    }
    return this.token;
  }
}
