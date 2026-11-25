import assert from "node:assert/strict";
import test from "node:test";
import { validateApiUrl } from "../scripts/validate-api-url.mjs";

test("accepts a public HTTPS URL with an optional stage path", () => {
  const parsed = validateApiUrl("https://www.iana.org/path");
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.pathname, "/path");
});

test("rejects HTTP, local, reserved, and credential-bearing API URLs", () => {
  for (const value of [
    "http://www.iana.org",
    "https://localhost/api",
    "https://emotionlab.invalid/api",
    "https://user:password@www.iana.org/api",
  ]) {
    assert.throws(() => validateApiUrl(value));
  }
});

test("rejects a missing API URL", () => {
  assert.throws(() => validateApiUrl(""), /falta VITE_API_URL/);
});
