// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === "test" ? false : ["error", "warn", "log"],
  });
  app.use(helmet());
  // Only the municipal logo upload sends a binary body; the command enforces the 2 MB limit.
  app.useBodyParser("raw", {
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "3mb",
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers["x-quenda-request"] !== "1"
    ) {
      res.status(403).type("application/problem+json").send({
        type: "about:blank",
        title: "forbidden",
        code: "forbidden",
        status: 403,
        detail: "Missing same-origin request header",
      });
      return;
    }
    next();
  });
  const config = new DocumentBuilder()
    .setTitle("Quenda API")
    .setDescription("Municipal sports reservations — V0")
    .setVersion("0.1.0")
    .addCookieAuth("quenda_session")
    .addTag(
      "public/open-data",
      "Open data of each municipality: facility catalogue (schema.org JSON-LD, CSV, GeoJSON) and DCAT-AP-ES catalogue. Licensed per municipality (CC BY 4.0 by default); no personal data.",
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/openapi.json",
  });
  app.enableShutdownHooks();
  return app;
}
