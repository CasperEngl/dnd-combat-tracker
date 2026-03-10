import { describe, expect, test } from "bun:test"
import assert from "node:assert/strict"
import type { AppStateRecord, CharacterRecord } from "~/lib/character-record"
import {
  getCanonicalCharacterPath,
  getCharacterPath,
  getCharacterSheetPath,
  getCreatedCharacterPath,
  getHomeRedirectTarget,
} from "~/lib/character-routing"

describe("character routing", () => {
  test("builds tracker and sheet paths for a character", () => {
    const character = buildCharacterRecord()

    expect(getCharacterPath(character._id)).toBe("/characters/character-1")
    expect(getCharacterSheetPath(character._id)).toBe(
      "/characters/character-1/sheet",
    )
  })

  test("routes supported characters to the tracker and unsupported ones to the sheet", () => {
    expect(getCanonicalCharacterPath(buildCharacterRecord())).toBe(
      "/characters/character-1",
    )
    expect(
      getCanonicalCharacterPath(
        buildCharacterRecord({
          className: "Wizard",
          classSlug: "wizard",
          flowFamilySlug: undefined,
          trackerSlug: undefined,
          status: "needs-tracker",
        }),
      ),
    ).toBe("/characters/character-1/sheet")
  })

  test("sends new rogues to the tracker and unsupported classes to the sheet", () => {
    expect(
      getCreatedCharacterPath(
        {
          name: "Nyx",
          className: "Rogue",
          subclassName: "Thief",
          level: 5,
        },
        buildCharacterId("character-2"),
      ),
    ).toBe("/characters/character-2")

    expect(
      getCreatedCharacterPath(
        {
          name: "Meris",
          className: "Wizard",
          subclassName: "Evoker",
          level: 5,
        },
        buildCharacterId("character-3"),
      ),
    ).toBe("/characters/character-3/sheet")
  })

  test("redirects home to the best character destination", () => {
    expect(getHomeRedirectTarget(buildEmptyAppState())).toBe("/characters/new")

    const rogue = buildCharacterRecord()
    const wizard = buildCharacterRecord({
      _id: buildCharacterId("character-2"),
      className: "Wizard",
      classSlug: "wizard",
      flowFamilySlug: undefined,
      trackerSlug: undefined,
      status: "needs-tracker",
    })

    expect(getHomeRedirectTarget(buildAppState([rogue, wizard]))).toBe(
      "/characters/character-1",
    )
    expect(
      getHomeRedirectTarget(
        buildAppState([rogue, wizard], {
          activeCharacter: wizard,
          activeCharacterId: wizard._id,
        }),
      ),
    ).toBe("/characters/character-2/sheet")
  })
})

function buildAppState(
  characters: CharacterRecord[],
  overrides: Partial<
    Extract<AppStateRecord, { activeCharacterId: CharacterRecord["_id"] }>
  > = {},
): AppStateRecord {
  const firstCharacter = characters[0]
  assert(firstCharacter, "buildAppState requires at least one character")

  const activeCharacter = overrides.activeCharacter ?? firstCharacter

  return {
    activeCharacterId: overrides.activeCharacterId ?? activeCharacter._id,
    activeCharacter,
    activeTrackerSettings: null,
    characters,
    ...overrides,
  }
}

function buildEmptyAppState(): AppStateRecord {
  return {
    activeCharacterId: null,
    activeCharacter: null,
    activeTrackerSettings: null,
    characters: [],
  }
}

function buildCharacterRecord(
  overrides: Partial<CharacterRecord> = {},
): CharacterRecord {
  return {
    _id: buildCharacterId("character-1"),
    _creationTime: 1,
    userId: "user-1" as CharacterRecord["userId"],
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
  return value as CharacterRecord["_id"]
}
