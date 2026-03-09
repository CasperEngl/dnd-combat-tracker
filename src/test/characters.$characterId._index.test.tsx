import "~/test/setup-dom"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { characterRouteTestHarness } from "~/test/character-route-test-harness"

describe("character tracker route", () => {
  beforeEach(() => {
    characterRouteTestHarness.reset()
  })

  afterEach(() => {
    characterRouteTestHarness.reset()
  })

  test("redirects unsupported classes to the sheet and shows a toast", async () => {
    characterRouteTestHarness.setCharacters([
      characterRouteTestHarness.buildCharacterRecord({
        className: "Wizard",
        classSlug: "wizard",
        subclassName: "Evoker",
        turnMachineSlug: undefined,
        status: "needs-tracker",
      }),
    ])

    const router = characterRouteTestHarness.renderCharacterRoutes(
      "/characters/character-1",
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/characters/character-1/sheet",
      )
    })

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "Turn tracking is not ready for this class yet.",
      )
    })
  })

  test("switches to a supported character tracker route", async () => {
    const user = userEvent.setup()
    const activeCharacter = characterRouteTestHarness.buildCharacterRecord()
    const nextCharacter = characterRouteTestHarness.buildCharacterRecord({
      _id: "character-2" as typeof activeCharacter._id,
      name: "Vex",
      subclassName: "Assassin",
    })

    characterRouteTestHarness.setCharacters([activeCharacter, nextCharacter])

    const router = characterRouteTestHarness.renderCharacterRoutes(
      "/characters/character-1",
    )

    await user.selectOptions(
      characterRouteTestHarness.getCharacterSwitcher(),
      nextCharacter._id,
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/characters/character-2")
    })

    expect(
      characterRouteTestHarness.mocks.setActiveCharacter,
    ).toHaveBeenCalledWith({
      characterId: nextCharacter._id,
    })
  })

  test("switches to an unsupported character sheet route", async () => {
    const user = userEvent.setup()
    const activeCharacter = characterRouteTestHarness.buildCharacterRecord()
    const nextCharacter = characterRouteTestHarness.buildCharacterRecord({
      _id: "character-3" as typeof activeCharacter._id,
      name: "Meris",
      className: "Wizard",
      classSlug: "wizard",
      subclassName: "Evoker",
      turnMachineSlug: undefined,
      status: "needs-tracker",
    })

    characterRouteTestHarness.setCharacters([activeCharacter, nextCharacter])

    const router = characterRouteTestHarness.renderCharacterRoutes(
      "/characters/character-1",
    )

    await user.selectOptions(
      characterRouteTestHarness.getCharacterSwitcher(),
      nextCharacter._id,
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/characters/character-3/sheet",
      )
    })

    expect(
      characterRouteTestHarness.mocks.setActiveCharacter,
    ).toHaveBeenCalledWith({
      characterId: nextCharacter._id,
    })
  })
})
