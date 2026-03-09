import "~/test/setup-dom"
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { characterRouteTestHarness } from "~/test/character-route-test-harness"

describe("character sheet route", () => {
  beforeEach(() => {
    characterRouteTestHarness.reset()
  })

  afterEach(() => {
    characterRouteTestHarness.reset()
  })

  test("shows the unsupported tracker toast when entered from tracker redirect state", async () => {
    const toastInfo = spyOn(toast, "info")

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
      expect(toastInfo).toHaveBeenCalledTimes(1)
    })

    toastInfo.mockRestore()
  })

  test("does not show the unsupported tracker toast on a normal sheet visit", async () => {
    const toastInfo = spyOn(toast, "info")

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

    expect(toastInfo).not.toHaveBeenCalled()
    toastInfo.mockRestore()
  })
})
