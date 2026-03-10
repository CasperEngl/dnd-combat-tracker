import { describe, expect, test } from "bun:test"
import {
  clampCharacterLevel,
  normalizeCharacterName,
  normalizeClassName,
  normalizeSubclassName,
  resolveCharacterFlow,
  resolveCharacterStatus,
  resolveTurnMachineSlug,
  toClassSlug,
} from "./characterModel"

describe("characterModel", () => {
  test("clamps and normalizes character level", () => {
    expect(clampCharacterLevel(0)).toBe(1)
    expect(clampCharacterLevel(3.9)).toBe(3)
    expect(clampCharacterLevel(99)).toBe(20)
  })

  test("normalizes character naming fields", () => {
    expect(normalizeCharacterName("  Shadowblade  ")).toBe("Shadowblade")
    expect(normalizeCharacterName("   ")).toBe("Unnamed Character")
    expect(normalizeClassName("  Rogue  ")).toBe("Rogue")
    expect(normalizeClassName("\n\t")).toBe("Adventurer")
    expect(normalizeSubclassName("  Assassin  ")).toBe("Assassin")
    expect(normalizeSubclassName("   ")).toBeUndefined()
  })

  test("builds stable class slugs", () => {
    expect(toClassSlug("Arcane Trickster")).toBe("arcane-trickster")
    expect(toClassSlug("  !!!  ")).toBe("adventurer")
    expect(toClassSlug("Fighter (Champion)")).toBe("fighter-champion")
  })

  test("resolves rogue flow as ready with tracker", () => {
    expect(resolveCharacterFlow("rogue")).toEqual({
      classSlug: "rogue",
      flowFamilySlug: "dual-wield-skirmisher",
      trackerSlug: "rogue",
      status: "ready",
    })
    expect(resolveTurnMachineSlug("rogue")).toBe("rogue")
    expect(resolveCharacterStatus("rogue")).toBe("ready")
  })

  test("marks unsupported classes as needing a tracker", () => {
    expect(resolveCharacterFlow("wizard")).toEqual({
      classSlug: "wizard",
      flowFamilySlug: undefined,
      trackerSlug: undefined,
      status: "needs-tracker",
    })
    expect(resolveTurnMachineSlug("wizard")).toBeUndefined()
    expect(resolveCharacterStatus(undefined)).toBe("needs-tracker")
  })
})
