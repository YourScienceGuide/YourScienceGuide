import { vi, type Mock } from "vitest";

export type MockFetchOptions = {
  ok?: boolean;
  status?: number;
  json?: unknown;
  jsonError?: boolean;
  networkError?: Error;
};

export function installFetchMock(options: MockFetchOptions = {}): Mock {
  const fetchMock = vi.fn(async () => {
    if (options.networkError) {
      throw options.networkError;
    }

    const ok = options.ok ?? true;
    const status = options.status ?? (ok ? 200 : 500);

    return {
      ok,
      status,
      json: options.jsonError
        ? async () => {
            throw new Error("invalid json");
          }
        : async () => options.json ?? {},
    } as Response;
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
