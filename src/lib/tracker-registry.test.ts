import { describe, expect, test } from "bun:test"
import {
  getTrackerDefinition,
  getTrackerDefinitionForCharacter,
} from "~/lib/tracker-registry"

describe("tracker registry", () => {
  test("resolves the rogue tracker definition", () => {
    expect(getTrackerDefinition("rogue")).toEqual({
      flowFamilySlug: "dual-wield-skirmisher",
      label: "Rogue",
      trackerSlug: "rogue",
    })
  })

  test("returns no definition for unsupported characters", () => {
    expect(
      getTrackerDefinitionForCharacter({
        trackerSlug: undefined,
      }),
    ).toBeUndefined()
  })

  test("includes a placeholder tracker slot for martial-basic", () => {
    expect(getTrackerDefinition("martial-basic")).toEqual({
      flowFamilySlug: "martial-basic",
      label: "Martial (placeholder)",
      trackerSlug: "martial-basic",
    })
  })
})
