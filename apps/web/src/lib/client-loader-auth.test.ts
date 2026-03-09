import { describe, expect, test } from "bun:test"
import {
  getConvexAuthTokenStorageKey,
  readClientLoaderAuthState,
} from "~/lib/client-loader-auth"

describe("client loader auth", () => {
  test("builds the same sanitized auth storage key format", () => {
    expect(
      getConvexAuthTokenStorageKey("https://small-mouse-123.convex.cloud"),
    ).toBe("__convexAuthJWT_httpssmallmouse123convexcloud")
  })

  test("reads an authenticated state from injected storage", () => {
    const storage = {
      getItem: (key: string) =>
        key === "__convexAuthJWT_httpssmallmouse123convexcloud"
          ? "token-123"
          : null,
    }

    expect(
      readClientLoaderAuthState({
        storage,
        storageNamespace: "https://small-mouse-123.convex.cloud",
      }),
    ).toEqual({
      token: "token-123",
      isAuthenticated: true,
    })
  })

  test("returns unauthenticated state when token is missing", () => {
    expect(
      readClientLoaderAuthState({
        storage: { getItem: () => null },
        storageNamespace: "https://small-mouse-123.convex.cloud",
      }),
    ).toEqual({
      token: null,
      isAuthenticated: false,
    })
  })

  test("returns unauthenticated state when storage is unavailable", () => {
    expect(
      readClientLoaderAuthState({
        storage: null,
        storageNamespace: "https://small-mouse-123.convex.cloud",
      }),
    ).toEqual({
      token: null,
      isAuthenticated: false,
    })
  })
})
