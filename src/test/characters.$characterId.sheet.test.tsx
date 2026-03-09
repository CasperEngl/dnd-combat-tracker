import "~/test/setup-dom"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { waitFor } from "@testing-library/react"
import { characterRouteTestHarness } from "~/test/character-route-test-harness"

describe("character sheet route", () => {
  beforeEach(() => {
    characterRouteTestHarness.reset()
  })

  afterEach(() => {
    characterRouteTestHarness.reset()
  })

  test("shows the unsupported tracker toast when entered from tracker redirect state", async () => {
    characterRouteTestHarness.setCharacters([
      characterRouteTestHarness.buildCharacterRecord({
        className: "Wizard",
        classSlug: "wizard",
        subclassName: "Evoker",
        turnMachineSlug: undefined,
        status: "needs-tracker",
      }),
    ])

    characterRouteTestHarness.renderCharacterRoutes({
      pathname: "/characters/character-1/sheet",
      state: { unsupportedTracker: true },
    })

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "Turn tracking is not ready for this class yet.",
      )
    })
  })

  test("does not show the unsupported tracker toast on a normal sheet visit", async () => {
    characterRouteTestHarness.setCharacters([
      characterRouteTestHarness.buildCharacterRecord({
        className: "Wizard",
        classSlug: "wizard",
        subclassName: "Evoker",
        turnMachineSlug: undefined,
        status: "needs-tracker",
      }),
    ])

    characterRouteTestHarness.renderCharacterRoutes(
      "/characters/character-1/sheet",
    )

    await waitFor(() => {
      expect(document.body.textContent).toContain("Character Sheet")
    })

    expect(document.body.textContent).not.toContain(
      "Turn tracking is not ready for this class yet.",
    )
  })
})
