import { describe, expect, test } from "bun:test"
import {
  clampCharacterLevel,
  normalizeClassName,
  normalizeSubclassName,
  resolveCharacterFlow,
  toClassSlug,
} from "~/lib/character-model"

describe("character model", () => {
  test("normalizes arbitrary class names into stable slugs", () => {
    expect(normalizeClassName("  Arcane Trickster  ")).toBe("Arcane Trickster")
    expect(toClassSlug("Arcane Trickster")).toBe("arcane-trickster")
  })

  test("resolves rogues into the dual-wield-skirmisher flow family", () => {
    expect(resolveCharacterFlow("rogue")).toEqual({
      classSlug: "rogue",
      flowFamilySlug: "dual-wield-skirmisher",
      trackerSlug: "rogue",
      status: "ready",
    })
  })

  test("leaves unsupported classes without a tracker", () => {
    expect(resolveCharacterFlow("wizard")).toEqual({
      classSlug: "wizard",
      flowFamilySlug: undefined,
      trackerSlug: undefined,
      status: "needs-tracker",
    })
  })

  test("clamps character level and omits blank subclasses", () => {
    expect(clampCharacterLevel(0)).toBe(1)
    expect(clampCharacterLevel(99)).toBe(20)
    expect(normalizeSubclassName("   ")).toBeUndefined()
    expect(normalizeSubclassName("Illusion")).toBe("Illusion")
  })
})
