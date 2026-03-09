import { useNavigate } from "react-router"
import { CharacterSheetScreen } from "~/components/character-sheet-screen"
import type { CharacterId } from "~/lib/character-record"
import {
  getCanonicalCharacterPath,
  getCreatedCharacterPath,
} from "~/lib/character-routing"
import { useCharacterRouteContext } from "./characters.$characterId"

export default function CharacterSheetRoute() {
  const {
    pageState,
    handleCreateCharacter,
    handleSetActiveCharacter,
    handleUpdateCharacter,
  } = useCharacterRouteContext()
  const navigate = useNavigate()
  const character = pageState.character

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
      rogueSettings={pageState.characterTrackerSettings}
    />
  )
}
