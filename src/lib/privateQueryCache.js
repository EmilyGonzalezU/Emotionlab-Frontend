/** Cancel in-flight work and discard all account-scoped cached data. */
export function clearPrivateQueryCache(queryClient) {
  if (!queryClient) return;
  void queryClient.cancelQueries();
  queryClient.clear();
}
