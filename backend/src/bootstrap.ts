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
  // Rate limits key on the client IP; trust X-Forwarded-For only from the
  // reverse proxies in front of the API (nginx, a TLS proxy), never from clients.
  app.set("trust proxy", process.env.TRUST_PROXY ?? "loopback, uniquelocal");
  app.use(helmet());
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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/openapi.json",
  });
  app.enableShutdownHooks();
  return app;
}
