import { useEffect } from "react"
import { useNavigate } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { TrackerScreen } from "~/components/tracker-screen"
import { DamageEntryProvider } from "~/context/damage-entry-context"
import { RogueTrackerProvider } from "~/context/rogue-tracker-context"
import type { CharacterId } from "~/lib/character-record"
import {
  getCanonicalCharacterPath,
  getCharacterSheetPath,
  isTrackerSupported,
} from "~/lib/character-routing"
import { useCharacterRouteContext } from "./characters.$characterId"

type UnsupportedTrackerState = {
  unsupportedTracker?: boolean
}

export default function CharacterTrackerRoute() {
  const { pageState, handleSetActiveCharacter } = useCharacterRouteContext()
  const navigate = useNavigate()
  const character = pageState.character

  if (!character) {
    return <LoadingScreen detail="Loading your tracker." />
  }

  if (!isTrackerSupported(character)) {
    return <UnsupportedTrackerRedirect characterId={character._id} />
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
    <RogueTrackerProvider
      character={character}
      key={character._id}
      rogueSettings={pageState.characterRogueSettings}
    >
      <DamageEntryProvider>
        <TrackerScreen
          activeCharacter={character}
          characters={pageState.characters}
          onSetActiveCharacter={handleCharacterSwitch}
          settingsHref={getCharacterSheetPath(character._id)}
        />
      </DamageEntryProvider>
    </RogueTrackerProvider>
  )
}

function UnsupportedTrackerRedirect({
  characterId,
}: {
  characterId: CharacterId
}) {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate(getCharacterSheetPath(characterId), {
      replace: true,
      state: { unsupportedTracker: true } satisfies UnsupportedTrackerState,
    })
  }, [characterId, navigate])

  return <LoadingScreen detail="Opening the character sheet instead." />
}
