// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { pagePath } from "../../domain/page-path";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { AnalyticsForwarder } from "../../../../shared/application/analytics-forwarder";
import { Result } from "../../../../shared/application/result";
/**
 * Passes one page view to the council's own Umami when it has one (#25). The visitor gets no
 * answer either way, so the page cannot tell whether analytics is on, and a slow or failing
 * Umami never delays the app: the view is sent in the background and a failure is only logged.
 */
@Injectable()
export class RecordPageView {
  private readonly logger = new Logger(RecordPageView.name);
  constructor(
    private readonly municipalities: Municipalities,
    private readonly forwarder: AnalyticsForwarder,
  ) {}
  async execute(args: {
    slug: string;
    path: string;
    language: string;
    screen: string;
    hostname: string;
    userAgent: string;
    ip: string;
  }): Promise<Result<void, never>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    const path = pagePath(args.path);
    if (
      !municipality?.analyticsUrl ||
      !municipality.analyticsWebsiteId ||
      !path
    )
      return Result.ok();
    this.forwarder
      .send({
        url: municipality.analyticsUrl,
        websiteId: municipality.analyticsWebsiteId,
        hostname: args.hostname,
        path,
        language: args.language,
        screen: args.screen,
        userAgent: args.userAgent,
        ip: args.ip,
      })
      .catch((error: unknown) =>
        this.logger.warn(
          `page view for ${municipality.slug} not recorded: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    return Result.ok();
  }
}
