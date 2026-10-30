// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { pagePath } from "../../domain/page-path";
import { isAnalyticsEvent, optedOut } from "../../domain/analytics-events";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import {
  AnalyticsApp,
  AnalyticsConfig,
} from "../../../../shared/application/analytics-config";
import { AnalyticsForwarder } from "../../../../shared/application/analytics-forwarder";
import { Result } from "../../../../shared/application/result";
/**
 * Passes one page view or event to the deployment's own Umami (#25, #57):
 * - the citizen app only for councils that switched analytics on, tagged with the council;
 * - the public website whenever the deployment counts it.
 * Nothing is sent when the browser asks not to be tracked (DNT or GPC). The visitor gets no answer
 * either way, and a slow or failing Umami never delays the page: the view goes in the background.
 */
@Injectable()
export class RecordPageView {
  private readonly logger = new Logger(RecordPageView.name);
  constructor(
    private readonly municipalities: Municipalities,
    private readonly config: AnalyticsConfig,
    private readonly forwarder: AnalyticsForwarder,
  ) {}
  async execute(args: {
    app: AnalyticsApp;
    slug: string | null;
    path: string;
    event: string | null;
    language: string;
    screen: string;
    hostname: string;
    userAgent: string;
    ip: string;
    dnt?: string;
    gpc?: string;
  }): Promise<Result<void, never>> {
    const path = pagePath(args.path);
    if (
      !path ||
      optedOut(args) ||
      !this.config.collects(args.app) ||
      (args.event !== null && !isAnalyticsEvent(args.app, args.event))
    )
      return Result.ok();
    let tag: string | null = null;
    if (args.app === "app") {
      const municipality = args.slug
        ? await this.municipalities.findBySlug(args.slug)
        : null;
      if (!municipality?.analyticsEnabled) return Result.ok();
      tag = municipality.slug;
    }
    this.forwarder
      .send({
        app: args.app,
        hostname: args.hostname,
        path,
        language: args.language,
        screen: args.screen,
        tag,
        event: args.event,
        userAgent: args.userAgent,
        ip: args.ip,
      })
      .catch((error: unknown) =>
        this.logger.warn(
          `${args.app} view not recorded: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    return Result.ok();
  }
}
