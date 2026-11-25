import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest } from "../src/lib/apiClient.js";

function installBrowserMocks(status) {
  const values = new Map([["token", "test-token"], ["user", "{}"], ["rol", "teacher"], ["theme", "dark"]]);
  const events = [];
  const previous = {
    localStorage: globalThis.localStorage,
    window: globalThis.window,
    fetch: globalThis.fetch,
  };
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
  globalThis.window = {
    location: { hash: "#/teacher" },
    dispatchEvent: (event) => events.push(event.type),
  };
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "denied" }), {
    status,
    headers: { "content-type": "application/json" },
  });
  return {
    values,
    events,
    restore() {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    },
  };
}

test("403 preserves authenticated state and does not signal cache clearing", async () => {
  const browser = installBrowserMocks(403);
  try {
    await assert.rejects(apiRequest("/private"), (error) => error.status === 403);
    assert.equal(browser.values.get("token"), "test-token");
    assert.equal(globalThis.window.location.hash, "#/teacher");
    assert.deepEqual(browser.events, []);
  } finally {
    browser.restore();
  }
});

test("401 clears auth keys, preserves unrelated storage, and signals cache clearing", async () => {
  const browser = installBrowserMocks(401);
  try {
    await assert.rejects(apiRequest("/private"), (error) => error.status === 401);
    assert.equal(browser.values.has("token"), false);
    assert.equal(browser.values.has("user"), false);
    assert.equal(browser.values.get("theme"), "dark");
    assert.equal(globalThis.window.location.hash, "#/");
    assert.deepEqual(browser.events, ["emotionlab:session-expired"]);
  } finally {
    browser.restore();
  }
});
