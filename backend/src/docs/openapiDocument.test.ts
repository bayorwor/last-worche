// Fails when a route is added or renamed without changing the API documentation.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { openapiDocument } from "./openapiDocument.ts";

const ROUTES_FOLDER = join(import.meta.dir, "../routes");

// Where app.ts mounts each route file.
const MOUNT_PATHS: Record<string, string> = {
  "activityRoutes.ts": "/activity",
  "aiRoutes.ts": "/ai",
  "authRoutes.ts": "/auth",
  "bookingRoutes.ts": "",
  "forecastRoutes.ts": "",
  "integrationRoutes.ts": "/integrations",
  "proofOfWorkRoutes.ts": "",
  "purchasingRoutes.ts": "/purchasing",
};

function routesInCode() {
  const routes = ["get /health"];
  for (const file of readdirSync(ROUTES_FOLDER)) {
    const source = readFileSync(join(ROUTES_FOLDER, file), "utf8");
    for (const [, method, path] of source.matchAll(/router\.(get|post|patch|put|delete)\(\s*"([^"]+)"/g)) {
      const fullPath = `${MOUNT_PATHS[file]}${path === "/" ? "" : path}`.replace(/:(\w+)/g, "{$1}");
      routes.push(`${method} ${fullPath}`);
    }
  }
  return routes.sort();
}

function routesInDocument() {
  return Object.entries(openapiDocument.paths)
    .flatMap(([path, operations]) => Object.keys(operations).map((method) => `${method} ${path}`))
    .sort();
}

describe("the API documentation", () => {
  test("knows where every route file is mounted", () => {
    expect(readdirSync(ROUTES_FOLDER).sort()).toEqual(Object.keys(MOUNT_PATHS).sort());
  });

  test("lists exactly the routes that exist", () => {
    expect(routesInDocument()).toEqual(routesInCode());
  });

  test("every operation names its responses", () => {
    for (const operations of Object.values(openapiDocument.paths)) {
      for (const operation of Object.values(operations)) {
        expect(Object.keys((operation as { responses: object }).responses).length).toBeGreaterThan(0);
      }
    }
  });
});
