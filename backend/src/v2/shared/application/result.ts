// SPDX-License-Identifier: AGPL-3.0-or-later
/** Expected application failures are values; only infrastructure failures throw. */
export class Result<T, E> {
  private constructor(
    private readonly state:
      { kind: "ok"; value: T } | { kind: "error"; error: E },
  ) {}
  get isFailure() {
    return this.state.kind === "error";
  }
  fold<R>(success: (value: T) => R, failure: (error: E) => R): R {
    return this.state.kind === "ok"
      ? success(this.state.value)
      : failure(this.state.error);
  }
  static ok(): Result<void, never>;
  static ok<T>(value: T): Result<T, never>;
  static ok<T>(value?: T): Result<T | undefined, never> {
    return new Result({ kind: "ok", value });
  }
  static err<E>(error: E): Result<never, E> {
    return new Result({ kind: "error", error });
  }
}
