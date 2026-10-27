// SPDX-License-Identifier: AGPL-3.0-or-later
export type ErrorCode =
  | "not_found"
  | "forbidden"
  | "unauthorized"
  | "validation"
  | "slot_taken"
  | "outside_opening"
  | "booking_limit"
  | "booking_window"
  | "cancellation_deadline"
  | "booking_cancelled"
  | "id_reused"
  | "calendar_in_use"
  | "demo_disabled"
  | "consent_required"
  | "resource_required"
  | "resource_unavailable"
  | "insufficient_contrast"
  | "invalid_holidays"
  | "unsupported_logo"
  | "logo_too_large"
  | "booking_blocked"
  | "attendance_window";
export type AppError<C extends ErrorCode = ErrorCode> = { code: C };
export function failure<C extends ErrorCode>(code: C): AppError<C> {
  return { code };
}
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}
