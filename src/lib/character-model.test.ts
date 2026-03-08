import { describe, expect, test } from "bun:test"
import {
  clampCharacterLevel,
  normalizeClassName,
  normalizeSubclassName,
  resolveCharacterStatus,
  resolveTurnMachineSlug,
  toClassSlug,
} from "~/lib/character-model"

describe("character model", () => {
  test("normalizes arbitrary class names into stable slugs", () => {
    expect(normalizeClassName("  Arcane Trickster  ")).toBe("Arcane Trickster")
    expect(toClassSlug("Arcane Trickster")).toBe("arcane-trickster")
  })

  test("treats rogues as supported and other classes as pending tracker work", () => {
    expect(resolveTurnMachineSlug("rogue")).toBe("rogue")
    expect(resolveCharacterStatus(resolveTurnMachineSlug("rogue"))).toBe(
      "ready",
    )
    expect(resolveTurnMachineSlug("wizard")).toBeUndefined()
    expect(resolveCharacterStatus(resolveTurnMachineSlug("wizard"))).toBe(
      "needs-tracker",
    )
  })

  test("clamps character level and omits blank subclasses", () => {
    expect(clampCharacterLevel(0)).toBe(1)
    expect(clampCharacterLevel(99)).toBe(20)
    expect(normalizeSubclassName("   ")).toBeUndefined()
    expect(normalizeSubclassName("Illusion")).toBe("Illusion")
  })
})
