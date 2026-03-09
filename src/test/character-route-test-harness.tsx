import { mock } from "bun:test"
import type { Id } from "@convex/_generated/dataModel"
import { render } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { Toaster } from "sonner"
import {
  type AppServices,
  AppServicesProvider,
} from "~/context/app-services-context"
import type {
  AppStateRecord,
  CharacterId,
  CharacterPageStateRecord,
  CharacterRecord,
} from "~/lib/character-record"

const { default: CharacterRouteLayout } = await import(
  "../routes/characters.$characterId"
)
const { default: CharacterTrackerRoute } = await import(
  "../routes/characters.$characterId._index"
)
const { default: CharacterSheetRoute } = await import(
  "../routes/characters.$characterId.sheet"
)

let characters: CharacterRecord[] = []

const rawSignInMock = mock(async () => ({ signingIn: false }))
const signInMock: ReturnType<AppServices["authActions"]>["signIn"] =
  rawSignInMock
const rawSignOutMock = mock(async () => undefined)
const signOutMock: ReturnType<AppServices["authActions"]>["signOut"] =
  rawSignOutMock
const rawCreateCharacterMock = mock(async () =>
  buildCharacterId("character-99"),
)
const createCharacterMock: ReturnType<AppServices["createCharacter"]> =
  rawCreateCharacterMock
const rawUpdateCharacterMock = mock(async () => buildCharacterId("character-1"))
const updateCharacterMock: ReturnType<AppServices["updateCharacter"]> =
  rawUpdateCharacterMock
const rawSetActiveCharacterMock = mock(async () =>
  buildUserPreferenceId("preference-1"),
)
const setActiveCharacterMock: ReturnType<AppServices["setActiveCharacter"]> =
  rawSetActiveCharacterMock
const rawUpsertRogueSettingsMock = mock(async () =>
  buildCharacterSettingsId("setting-1"),
)
const upsertRogueSettingsMock: ReturnType<AppServices["upsertRogueSettings"]> =
  rawUpsertRogueSettingsMock

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
    <AppServicesProvider value={buildAppServices()}>
      <RouterProvider router={router} />
      <Toaster />
    </AppServicesProvider>,
  )

  return router
}

function buildAppServices(): AppServices {
  return {
    authActions: () => ({ signIn: signInMock, signOut: signOutMock }),
    authState: () => ({ isAuthenticated: true, isLoading: false }),
    appState: () => buildAppState(),
    characterPageState: (characterId) => buildPageState(characterId),
    createCharacter: () => createCharacterMock,
    updateCharacter: () => updateCharacterMock,
    setActiveCharacter: () => setActiveCharacterMock,
    upsertRogueSettings: () => upsertRogueSettingsMock,
  }
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
    activeRogueSettings: null,
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
    characterRogueSettings: null,
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
    subclassName: "Thief",
    level: 5,
    turnMachineSlug: "rogue",
    status: "ready",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function buildCharacterId(value: string) {
  return value as CharacterId
}

function buildCharacterSettingsId(value: string) {
  return value as NonNullable<
    CharacterPageStateRecord["characterRogueSettings"]
  >["_id"]
}

function buildUserId(value: string) {
  return value as CharacterRecord["userId"]
}

function buildUserPreferenceId(value: string) {
  return value as Id<"userPreferences">
}
