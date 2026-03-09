const convexAuthJwtStorageKeyPrefix = "__convexAuthJWT"

type LoaderAuthStorage = Pick<Storage, "getItem">

type ReadClientLoaderAuthStateOptions = {
  storage?: LoaderAuthStorage | null
  storageNamespace?: string | null
}

const sanitizeStorageNamespace = (namespace: string) =>
  namespace.replace(/[^a-zA-Z0-9]/g, "")

export const getConvexAuthTokenStorageKey = (storageNamespace: string) =>
  `${convexAuthJwtStorageKeyPrefix}_${sanitizeStorageNamespace(storageNamespace)}`

const getDefaultLoaderAuthStorage = (): LoaderAuthStorage | null => {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage
}

export const readClientLoaderAuthState = (
  options: ReadClientLoaderAuthStateOptions = {},
) => {
  const storage = options.storage ?? getDefaultLoaderAuthStorage()
  const storageNamespace = options.storageNamespace

  if (!storage || !storageNamespace) {
    return {
      token: null,
      isAuthenticated: false,
    }
  }

  const token = storage.getItem(getConvexAuthTokenStorageKey(storageNamespace))

  return {
    token,
    isAuthenticated: token !== null,
  }
}
