// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Request, Response } from "express";
import { Publication } from "../formats/publication";
import type { OpenPublication } from "../../domain/open-facility.read-model";
/**
 * Open data is public, cacheable and reusable from any origin: these headers override the
 * global `Cache-Control: no-store` and helmet's same-origin resource policy. No cookies are read.
 */
export function sendOpenData(
  response: Response,
  mediaType: string,
  filename: string,
  body: string,
) {
  response.setHeader("Content-Type", mediaType);
  response.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  response.setHeader("Cache-Control", "public, max-age=300");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  return body;
}
/**
 * Absolute URLs need the public origin: PUBLIC_URL in production, otherwise the origin the
 * request reached (the development proxy keeps the browser's host).
 */
export function publication<T extends OpenPublication>(
  request: Request,
  data: T,
) {
  const configured = process.env.PUBLIC_URL?.replace(/\/+$/, "");
  return new Publication(
    configured || `${request.protocol}://${request.get("host") ?? "localhost"}`,
    data,
  );
}
export const openDataTag = "public/open-data";
