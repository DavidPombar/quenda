// SPDX-License-Identifier: AGPL-3.0-or-later
import { ExecutionContext, Module, SetMetadata } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
const SENSITIVE = "quenda:sensitive-endpoint";
const minute = 60_000;
/** Marks an endpoint that also gets the stricter per-client limit (sign-in). */
export const SensitiveEndpoint = () => SetMetadata(SENSITIVE, true);
function perMinute(variable: string, fallback: number) {
  const value = Number(process.env[variable]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
function isSensitive(context: ExecutionContext) {
  return Reflect.getMetadata(SENSITIVE, context.getHandler()) === true;
}
/**
 * In-memory, per-process limits keyed by client IP (T4). Limits are read when
 * the application starts; several API replicas each enforce their own window.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            name: "requests",
            ttl: minute,
            limit: perMinute("RATE_LIMIT_PER_MINUTE", 600),
          },
          {
            name: "sessions",
            ttl: minute,
            limit: perMinute("SESSION_RATE_LIMIT_PER_MINUTE", 30),
            skipIf: (context) => !isSensitive(context),
          },
        ],
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
