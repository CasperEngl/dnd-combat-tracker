import { mock } from "bun:test"
import type { Id } from "@convex/_generated/dataModel"
import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { render } from "@testing-library/react"
import { ConvexReactClient } from "convex/react"
import { getFunctionName } from "convex/server"
import { createMemoryRouter, RouterProvider } from "react-router"
import { Toaster } from "sonner"
import { ClientLoaderToastBridge } from "~/components/client-loader-toast-bridge"
import { hookApi } from "~/generated/convex-hook-api"
import type {
  AppStateRecord,
  CharacterId,
  CharacterMutationValues,
  CharacterPageStateRecord,
  CharacterRecord,
} from "~/lib/character-record"

const { default: CharacterRouteLayout } = await import(
  "../routes/characters.$characterId"
)
const { default: CharacterTrackerRoute } = await import(
  "../routes/characters.$characterId._index"
)
const { redirectUnsupportedTracker } = await import(
  "../routes/characters.$characterId._index"
)
const { default: CharacterSheetRoute } = await import(
  "../routes/characters.$characterId.sheet"
)

let characters: CharacterRecord[] = []

const rawSignInMock = mock(async () => ({ signingIn: false }))
const signInMock = rawSignInMock
const rawSignOutMock = mock(async () => undefined)
const signOutMock = rawSignOutMock
const rawCreateCharacterMock = mock(async (_args: CharacterMutationValues) =>
  buildCharacterId("character-99"),
)
const createCharacterMock = buildReactMutation(rawCreateCharacterMock)
const rawUpdateCharacterMock = mock(
  async (_args: CharacterMutationValues & { characterId: CharacterId }) =>
    buildCharacterId("character-1"),
)
const updateCharacterMock = buildReactMutation(rawUpdateCharacterMock)
const rawSetActiveCharacterMock = mock(
  async (_args: { characterId: CharacterId }) =>
    buildUserPreferenceId("preference-1"),
)
const setActiveCharacterMock = buildReactMutation(rawSetActiveCharacterMock)
const rawUpsertRogueSettingsMock = mock(
  async (_args: {
    applyDexToBothWeapons: boolean
    characterId: CharacterId
    dexModifier: number
  }) => buildCharacterSettingsId("setting-1"),
)
const upsertRogueSettingsMock = buildReactMutation(rawUpsertRogueSettingsMock)

export const characterRouteTestHarness = {
  buildCharacterRecord,
  getCharacterSwitcher,
  mocks: {
    createCharacter: rawCreateCharacterMock,
    setActiveCharacter: rawSetActiveCharacterMock,
    signIn: rawSignInMock,
    signOut: rawSignOutMock,
    updateCharacter: rawUpdateCharacterMock,
    upsertRogueSettings: rawUpsertRogueSettingsMock,
  },
  renderCharacterRoutes,
  reset() {
    characters = []
    rawSignInMock.mockClear()
    rawSignOutMock.mockClear()
    rawCreateCharacterMock.mockClear()
    rawUpdateCharacterMock.mockClear()
    rawSetActiveCharacterMock.mockClear()
    rawUpsertRogueSettingsMock.mockClear()
    window.sessionStorage.clear()
    document.body.innerHTML = ""
  },
  setCharacters(nextCharacters: CharacterRecord[]) {
    characters = nextCharacters
  },
}

function renderCharacterRoutes(
  initialEntry: string | { pathname: string; state?: unknown },
) {
  const router = createMemoryRouter(
    [
      {
        path: "/characters/:characterId",
        element: <CharacterRouteLayout />,
        children: [
          {
            index: true,
            loader: ({ params }) => {
              const characterId = params.characterId as CharacterId
              const pageState = buildPageState(characterId)

              redirectUnsupportedTracker(pageState.character, characterId)

              return null
            },
            element: <CharacterTrackerRoute />,
          },
          {
            path: "sheet",
            element: <CharacterSheetRoute />,
          },
        ],
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  )

  render(
    <ConvexAuthProvider client={createFakeConvexClient()}>
      <hookApi.Provider value={buildConvexDependencies()}>
        <Toaster />
        <ClientLoaderToastBridge />
        <RouterProvider router={router} />
      </hookApi.Provider>
    </ConvexAuthProvider>,
  )

  return router
}

function buildConvexDependencies() {
  return {
    auth: {
      actions: () => ({ signIn: signInMock, signOut: signOutMock }),
      state: () => ({ isAuthenticated: true, isLoading: false }),
    },
    queries: {
      characters: {
        getAppState: () => buildAppState(),
        getCharacterPageState: (args) =>
          args === "skip" ? undefined : buildPageState(args.characterId),
      },
    },
    mutations: {
      characterSettings: {
        upsertRogueSettings: () => upsertRogueSettingsMock,
      },
      characters: {
        createCharacter: () => createCharacterMock,
        setActiveCharacter: () => setActiveCharacterMock,
        updateCharacter: () => updateCharacterMock,
      },
    },
  } satisfies Parameters<typeof hookApi.Provider>[0]["value"]
}

function getCharacterSwitcher() {
  const switcher = document.querySelector("select")

  if (!(switcher instanceof HTMLSelectElement)) {
    throw new Error("Expected character switcher to render")
  }

  return switcher
}

function buildAppState(): AppStateRecord {
  const activeCharacter = characters[0] ?? null

  return {
    activeCharacterId: activeCharacter?._id ?? null,
    activeCharacter,
    activeTrackerSettings: null,
    characters,
  }
}

function buildPageState(characterId: CharacterId): CharacterPageStateRecord {
  const character =
    characters.find((entry) => entry._id === characterId) ??
    characters[0] ??
    null

  return {
    activeCharacterId: characters[0]?._id ?? null,
    character,
    characterTrackerSettings: null,
    characters,
  }
}

function buildCharacterRecord(
  overrides: Partial<CharacterRecord> = {},
): CharacterRecord {
  return {
    _id: buildCharacterId("character-1"),
    _creationTime: 1,
    userId: buildUserId("user-1"),
    name: "Nyx",
    className: "Rogue",
    classSlug: "rogue",
    flowFamilySlug: "dual-wield-skirmisher",
    subclassName: "Thief",
    level: 5,
    trackerSlug: "rogue",
    status: "ready",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function buildCharacterId(value: string) {
  return value as CharacterId
}

function createFakeConvexClient() {
  const client = new ConvexReactClient("https://unused.convex.cloud")

  client.setAuth = (_fetchToken, onChange) => {
    onChange?.(true)
  }
  client.clearAuth = () => {}
  client.watchQuery = (query, args) => ({
    journal: () => undefined,
    localQueryResult: () => getQueryResult(getFunctionName(query), args),
    onUpdate: () => () => {},
  })
  client.mutation = (mutation, args) =>
    getMutationResult(getFunctionName(mutation), args)
  client.action = async () => undefined
  client.connectionState = () => ({
    connectionCount: 1,
    connectionRetries: 0,
    hasEverConnected: true,
    hasInflightRequests: false,
    inflightActions: 0,
    inflightMutations: 0,
    isWebSocketConnected: true,
    timeOfOldestInflightRequest: null,
  })
  client.subscribeToConnectionState = () => () => {}

  return client
}

function buildReactMutation<Args, Result>(
  callback: (args: Args) => Promise<Result>,
) {
  const mutation = Object.assign((args: Args) => callback(args), {
    withOptimisticUpdate() {
      return mutation
    },
  })

  return mutation
}

function getMutationResult(functionName: string, args: unknown) {
  switch (functionName) {
    case "characters:createCharacter":
      return rawCreateCharacterMock(
        args as Parameters<typeof rawCreateCharacterMock>[0],
      )
    case "characters:setActiveCharacter":
      return rawSetActiveCharacterMock(
        args as Parameters<typeof rawSetActiveCharacterMock>[0],
      )
    case "characters:updateCharacter":
      return rawUpdateCharacterMock(
        args as Parameters<typeof rawUpdateCharacterMock>[0],
      )
    case "characterSettings:upsertRogueSettings":
      return rawUpsertRogueSettingsMock(
        args as Parameters<typeof rawUpsertRogueSettingsMock>[0],
      )
    default:
      throw new Error(`Unexpected mutation in test harness: ${functionName}`)
  }
}

function getQueryResult(functionName: string, args: unknown) {
  switch (functionName) {
    case "characters:getAppState":
      return buildAppState()
    case "characters:getCharacterPageState":
      if (!args || args === "skip") {
        return undefined
      }

      return buildPageState((args as { characterId: CharacterId }).characterId)
    default:
      throw new Error(`Unexpected query in test harness: ${functionName}`)
  }
}

function buildCharacterSettingsId(value: string) {
  return value as NonNullable<
    CharacterPageStateRecord["characterTrackerSettings"]
  >["_id"]
}

function buildUserId(value: string) {
  return value as CharacterRecord["userId"]
}

function buildUserPreferenceId(value: string) {
  return value as Id<"userPreferences">
}
