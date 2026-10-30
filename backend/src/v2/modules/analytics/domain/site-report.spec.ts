// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { TOP, siteReport } from "./site-report";
const empty = {
  pages: [],
  referrers: [],
  devices: [],
  languages: [],
  events: [],
};
describe("siteReport", () => {
  it("should derive bounce rate and average visit length from Umami's totals", () => {
    const report = siteReport(
      { pageviews: 30, visitors: 8, visits: 10, bounces: 4, totaltime: 1250 },
      empty,
    );
    expect(report).toMatchObject({
      visitors: 8,
      visits: 10,
      pageviews: 30,
      bounceRate: 40,
      averageVisitSeconds: 125,
    });
  });
  it("should leave rates empty without visits", () => {
    const report = siteReport(
      { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 },
      empty,
    );
    expect(report.bounceRate).toBeNull();
    expect(report.averageVisitSeconds).toBeNull();
  });
  it("should keep the busiest rows of each list, without blanks", () => {
    const pages = Array.from({ length: 15 }, (_, i) => ({
      value: `/app/x/${i}`,
      count: i,
    }));
    const report = siteReport(
      { pageviews: 1, visitors: 1, visits: 1, bounces: 1, totaltime: 0 },
      { ...empty, pages, referrers: [{ value: "", count: 99 }] },
    );
    expect(report.pages).toHaveLength(TOP);
    expect(report.pages[0]).toEqual({ value: "/app/x/14", count: 14 });
    expect(report.referrers).toEqual([]);
  });
});
