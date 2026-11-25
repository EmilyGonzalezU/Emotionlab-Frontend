const AUTH_KEYS = ["token", "user", "rol"];

export function clearAuthStorage(storage = globalThis.localStorage) {
  for (const key of AUTH_KEYS) storage?.removeItem(key);
}
