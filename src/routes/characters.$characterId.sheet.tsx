import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { toast } from "sonner"
import { CharacterSheetScreen } from "~/components/character-sheet-screen"
import type { CharacterId } from "~/lib/character-record"
import {
  getCanonicalCharacterPath,
  getCreatedCharacterPath,
} from "~/lib/character-routing"
import { useCharacterRouteContext } from "./characters.$characterId"

type UnsupportedTrackerState = {
  unsupportedTracker?: boolean
}

export default function CharacterSheetRoute() {
  const {
    pageState,
    handleCreateCharacter,
    handleSetActiveCharacter,
    handleUpdateCharacter,
  } = useCharacterRouteContext()
  const navigate = useNavigate()
  const location = useLocation()
  const character = pageState.character

  useEffect(() => {
    const state = location.state as UnsupportedTrackerState | null

    if (state?.unsupportedTracker) {
      toast.info(
        "Turn tracking is not ready for this class yet. You can still keep the character sheet up to date here.",
      )
    }
  }, [location.state])

  if (!character) {
    return null
  }

  const handleCharacterSwitch = async (nextCharacterId: CharacterId) => {
    const nextCharacter = pageState.characters.find(
      (entry) => entry._id === nextCharacterId,
    )

    if (!nextCharacter) {
      return
    }

    await handleSetActiveCharacter(nextCharacterId)
    await navigate(getCanonicalCharacterPath(nextCharacter))
  }

  return (
    <CharacterSheetScreen
      activeCharacter={character}
      characters={pageState.characters}
      onCreateCharacter={async (values) => {
        const nextCharacterId = await handleCreateCharacter(values)
        await navigate(getCreatedCharacterPath(values, nextCharacterId))
      }}
      onSetActiveCharacter={(nextCharacterId) => {
        void handleCharacterSwitch(nextCharacterId)
      }}
      onUpdateCharacter={async (values) => {
        await handleUpdateCharacter(values)
      }}
      rogueSettings={pageState.characterRogueSettings}
    />
  )
}
