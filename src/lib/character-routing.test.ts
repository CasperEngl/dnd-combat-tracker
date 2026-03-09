import { describe, expect, test } from "bun:test"
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
          turnMachineSlug: undefined,
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
    expect(getHomeRedirectTarget(buildAppState([]))).toBe("/characters/new")

    const rogue = buildCharacterRecord()
    const wizard = buildCharacterRecord({
      _id: buildCharacterId("character-2"),
      className: "Wizard",
      classSlug: "wizard",
      turnMachineSlug: undefined,
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
    expect(
      getHomeRedirectTarget(
        buildAppState([wizard], {
          activeCharacter: null,
          activeCharacterId: null,
        }),
      ),
    ).toBe("/characters/character-2/sheet")
  })
})

function buildAppState(
  characters: CharacterRecord[],
  overrides: Partial<AppStateRecord> = {},
): AppStateRecord {
  const activeCharacter = characters[0] ?? null

  return {
    activeCharacterId: activeCharacter?._id ?? null,
    activeCharacter,
    activeRogueSettings: null,
    characters,
    ...overrides,
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
  return value as CharacterRecord["_id"]
}
