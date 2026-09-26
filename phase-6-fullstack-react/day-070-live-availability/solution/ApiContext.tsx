import { createContext, useContext, type ReactNode } from "react";
import type { Api } from "./api.ts";

// Already written: hands the API client to any component that needs it, so tests can hand in a fake.
const ApiContext = createContext<Api | null>(null);

export function ApiProvider({ api, children }: { api: Api; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside <ApiProvider>");
  return api;
}
