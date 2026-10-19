// The browser side. Access tokens are short-lived, so they run out while someone is using the app,
// often in several tabs or several requests at once. Each one gets a 401 at the same moment.
// If each started its own refresh, the first would rotate the refresh token and the rest would
// present a used-up one: reuse detected, family revoked, the user logged out for no reason.
// The fix: only one refresh at a time, and everyone waits for it.

export function singleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  // TODO: keep the running promise. While it runs, every caller gets that same promise.
  //   When it settles (success OR failure), forget it, so the next call runs task() again.
  void task;
  throw new Error("not implemented yet");
}

export interface AuthClientOptions {
  send: (path: string, accessToken: string) => Promise<Response>;
  refresh: () => Promise<string>; // calls POST /auth/refresh and returns the new access token
  accessToken: string;
}

export function createAuthClient(options: AuthClientOptions) {
  let accessToken = options.accessToken;
  const refreshOnce = singleFlight(async () => {
    accessToken = await options.refresh();
    return accessToken;
  });

  return {
    get accessToken() {
      return accessToken;
    },
    async request(path: string): Promise<Response> {
      // TODO: send with the current token. Anything but a 401 -> return it.
      //   On a 401: if accessToken changed while this request was out, someone already refreshed: use theirs.
      //   Otherwise await refreshOnce(). Then send again, once. A second 401 goes back to the caller.
      void [refreshOnce, path];
      throw new Error("not implemented yet");
    },
  };
}
