// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AnalyticsReader, ReadRange } from "../analytics-reader";
import { siteReport } from "../../domain/site-report";
import {
  SiteReport,
  WebAnalytics,
} from "../../domain/web-analytics.read-model";
import { MunicipalityInsights } from "../../../insights/application/municipality-insights";
import { AnalyticsConfig } from "../../../../shared/application/analytics-config";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Principal, can } from "../../../../shared/application/principal";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Days shown when no range is given: the last week, up to today. */
const DEFAULT_DAYS = 7;
export type GetWebAnalyticsError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"analytics_unavailable">;
export type WebAnalyticsScope =
  | { kind: "deployment"; principal: OperatorPrincipal }
  | { kind: "municipality"; principal: Principal };
/**
 * Aggregated visits from the deployment's Umami (#57): the operator sees the app, the website and
 * each council with analytics on; a manager sees only their council's app visits. Umami is not
 * called when it is not configured or the council has analytics off.
 */
@Injectable()
export class GetWebAnalytics {
  private readonly logger = new Logger(GetWebAnalytics.name);
  constructor(
    private readonly reader: AnalyticsReader,
    private readonly config: AnalyticsConfig,
    private readonly municipalities: Municipalities,
    private readonly insights: MunicipalityInsights,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    scope: WebAnalyticsScope;
    from?: string;
    to?: string;
  }): Promise<Result<WebAnalytics, GetWebAnalyticsError>> {
    const { scope } = args;
    if (
      scope.kind === "deployment"
        ? !canOperate(scope.principal, "deployment:insights")
        : !can(scope.principal, "insights:view")
    )
      return Result.err(failure("forbidden"));
    const own =
      scope.kind === "municipality"
        ? await this.municipalities.find(scope.principal.tenantId)
        : null;
    if (scope.kind === "municipality" && !own)
      return Result.err(failure("not_found"));
    const timezone = own?.timezone ?? this.config.deploymentTimezone();
    const range = this.range(timezone, args);
    if (!range) return Result.err(failure("validation"));
    const empty: WebAnalytics = {
      available: this.config.reads(),
      enabled: own ? own.analyticsEnabled : true,
      from: range.from.toString(),
      to: range.to.toString(),
      app: null,
      web: null,
      municipalities: [],
    };
    if (!empty.available || !empty.enabled) return Result.ok(empty);
    const read: ReadRange = {
      startAt: range.from.toZonedDateTime(timezone).epochMilliseconds,
      endAt: range.to.add({ days: 1 }).toZonedDateTime(timezone)
        .epochMilliseconds,
    };
    const websites = this.config.umami()!.websites;
    try {
      if (own)
        return Result.ok({
          ...empty,
          app: await this.site(websites.app!, read, own.slug),
        });
      const councils = (await this.municipalities.list()).filter(
        (council) => council.analyticsEnabled,
      );
      const [app, web, rows] = await Promise.all([
        this.site(websites.app!, read, null),
        websites.web ? this.site(websites.web, read, null) : null,
        // One read per council: Umami v2 filters totals by tag but has no per-tag breakdown.
        Promise.all(
          councils.map(async (council) => {
            const totals = await this.reader.totals(
              websites.app!,
              read,
              council.slug,
            );
            return {
              slug: council.slug,
              name: council.name,
              visitors: totals.visitors,
              visits: totals.visits,
              pageviews: totals.pageviews,
            };
          }),
        ),
      ]);
      return Result.ok({
        ...empty,
        app,
        web,
        municipalities: rows.sort((a, b) => b.pageviews - a.pageviews),
      });
    } catch (error) {
      this.logger.warn(
        `Umami statistics unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.err(failure("analytics_unavailable"));
    }
  }
  private range(
    timezone: string,
    args: { from?: string; to?: string },
  ): { from: Temporal.PlainDate; to: Temporal.PlainDate } | null {
    if (args.from === undefined && args.to === undefined) {
      const to = this.clock.now().toZonedDateTimeISO(timezone).toPlainDate();
      return { from: to.subtract({ days: DEFAULT_DAYS - 1 }), to };
    }
    return this.insights.range(timezone, args);
  }
  private async site(
    website: string,
    range: ReadRange,
    tag: string | null,
  ): Promise<SiteReport> {
    const [totals, pages, referrers, devices, languages, events] =
      await Promise.all([
        this.reader.totals(website, range, tag),
        this.reader.metric(website, "url", range, tag),
        this.reader.metric(website, "referrer", range, tag),
        this.reader.metric(website, "device", range, tag),
        this.reader.metric(website, "language", range, tag),
        this.reader.metric(website, "event", range, tag),
      ]);
    return siteReport(totals, { pages, referrers, devices, languages, events });
  }
}
