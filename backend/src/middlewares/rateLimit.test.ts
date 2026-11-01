import { describe, expect, test } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { TooManyRequestsError } from "../domain/errors.ts";
import { limitPerMinute } from "./rateLimit.ts";

function requestFrom(ip: string) {
  return { ip } as Request;
}

function run(limit: ReturnType<typeof limitPerMinute>, ip = "1.1.1.1") {
  limit(requestFrom(ip), {} as Response, (() => {}) as NextFunction);
}

describe("limitPerMinute", () => {
  test("accepts requests up to the limit", () => {
    const limit = limitPerMinute(2);

    expect(() => {
      run(limit);
      run(limit);
    }).not.toThrow();
  });

  test("rejects the request over the limit", () => {
    const limit = limitPerMinute(1);
    run(limit);

    expect(() => run(limit)).toThrow(TooManyRequestsError);
  });

  test("counts each network address on its own", () => {
    const limit = limitPerMinute(1);
    run(limit, "1.1.1.1");

    expect(() => run(limit, "2.2.2.2")).not.toThrow();
  });

  test("starts counting again after a minute", () => {
    let time = 0;
    const limit = limitPerMinute(1, () => time);
    run(limit);

    time = 60_000;

    expect(() => run(limit)).not.toThrow();
  });
});
