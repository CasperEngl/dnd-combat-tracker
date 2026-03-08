import { describe, expect, test } from "bun:test"
import { clampDexModifier, getSneakAttackDiceCount } from "~/lib/rogue-tracker"

describe("rogue tracker", () => {
  test("clamps dex modifier to the supported tracker range", () => {
    expect(clampDexModifier(-99)).toBe(-5)
    expect(clampDexModifier(3)).toBe(3)
    expect(clampDexModifier(99)).toBe(10)
  })

  test("scales sneak attack dice from rogue level", () => {
    expect(getSneakAttackDiceCount(1)).toBe(1)
    expect(getSneakAttackDiceCount(5)).toBe(3)
    expect(getSneakAttackDiceCount(20)).toBe(10)
  })
})
