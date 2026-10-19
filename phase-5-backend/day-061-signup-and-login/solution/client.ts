// The browser side. Access tokens are short-lived, so they run out while someone is using the app,
// often in several tabs or several requests at once. Each one gets a 401 at the same moment.
// If each started its own refresh, the first would rotate the refresh token and the rest would
// present a used-up one: reuse detected, family revoked, the user logged out for no reason.
// The fix: only one refresh at a time, and everyone waits for it.

export function singleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;
  return () => {
    // Clear the slot when it settles, success or failure, so the next expiry gets a fresh attempt.
    inFlight ??= task().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
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
      const usedToken = accessToken;
      const response = await options.send(path, usedToken);
      if (response.status !== 401) return response;
      // Someone else may already have refreshed while this request was out. Then just replay with their token.
      const fresh = accessToken !== usedToken ? accessToken : await refreshOnce();
      return options.send(path, fresh); // replay once; a second 401 means really logged out
    },
  };
}
