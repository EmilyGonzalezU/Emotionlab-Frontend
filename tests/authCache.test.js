import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { clearAuthStorage } from "../src/lib/authStorage.js";
import { clearPrivateQueryCache } from "../src/lib/privateQueryCache.js";

test("clearing authentication removes only auth keys", () => {
  const values = new Map([
    ["token", "private-token"],
    ["user", "{}"],
    ["rol", "teacher"],
    ["theme", "dark"],
  ]);
  const storage = { removeItem: (key) => values.delete(key) };

  clearAuthStorage(storage);

  assert.deepEqual([...values.entries()], [["theme", "dark"]]);
});

test("clearing account cache removes private query data", () => {
  const client = new QueryClient();
  client.setQueryData(["sessions"], [{ session_id: "one" }]);

  clearPrivateQueryCache(client);

  assert.equal(client.getQueryData(["sessions"]), undefined);
  client.clear();
});
