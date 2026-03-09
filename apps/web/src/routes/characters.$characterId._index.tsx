import { api } from "@dnd-combat-tracker/convex"
import type { Id } from "@dnd-combat-tracker/convex/data-model"
import { ConvexHttpClient } from "convex/browser"
import { Navigate, redirect, useNavigate } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { TrackerScreen } from "~/components/tracker-screen"
import { DamageEntryProvider } from "~/context/damage-entry-context"
import { RogueTrackerProvider } from "~/context/rogue-tracker-context"
import type { TrackerSlug } from "~/lib/character-model"
import type { CharacterId } from "~/lib/character-record"
import {
  getCanonicalCharacterPath,
  getCharacterSheetPath,
} from "~/lib/character-routing"
import { readClientLoaderAuthState } from "~/lib/client-loader-auth"
import { queueClientLoaderInfoToast } from "~/lib/client-loader-toast"
import { getTrackerDefinitionForCharacter } from "~/lib/tracker-registry"
import { useCharacterRouteContext } from "./characters.$characterId"

const convexUrl = import.meta.env.VITE_CONVEX_URL

type TrackerRouteContentProps = {
  character: NonNullable<
    ReturnType<typeof useCharacterRouteContext>["pageState"]["character"]
  >
  characters: ReturnType<
    typeof useCharacterRouteContext
  >["pageState"]["characters"]
  handleCharacterSwitch: (nextCharacterId: CharacterId) => Promise<void>
  characterTrackerSettings: ReturnType<
    typeof useCharacterRouteContext
  >["pageState"]["characterTrackerSettings"]
}

function RogueTrackerRouteContent({
  character,
  characters,
  handleCharacterSwitch,
  characterTrackerSettings,
}: TrackerRouteContentProps) {
  return (
    <RogueTrackerProvider
      character={character}
      key={character._id}
      rogueSettings={characterTrackerSettings}
    >
      <DamageEntryProvider>
        <TrackerScreen
          activeCharacter={character}
          characters={characters}
          onSetActiveCharacter={handleCharacterSwitch}
          settingsHref={getCharacterSheetPath(character._id)}
        />
      </DamageEntryProvider>
    </RogueTrackerProvider>
  )
}

const trackerRouteContentBySlug: Partial<
  Record<TrackerSlug, (props: TrackerRouteContentProps) => React.JSX.Element>
> = {
  rogue: RogueTrackerRouteContent,
}

const unsupportedTrackerToastMessage =
  "Turn tracking is not ready for this class yet. You can still keep the character sheet up to date here."

export function redirectUnsupportedTracker(
  character: { trackerSlug?: string } | null,
  characterId: CharacterId,
) {
  const trackerDefinition = character
    ? getTrackerDefinitionForCharacter(character)
    : undefined
  const trackerRouteContent = trackerDefinition
    ? trackerRouteContentBySlug[trackerDefinition.trackerSlug]
    : undefined

  if (character && !trackerRouteContent) {
    queueClientLoaderInfoToast(unsupportedTrackerToastMessage)
    throw redirect(getCharacterSheetPath(characterId))
  }
}

export async function clientLoader({
  params,
}: {
  params: { characterId: string }
}) {
  if (!convexUrl) {
    return null
  }

  const client = new ConvexHttpClient(convexUrl)
  const { token } = readClientLoaderAuthState({
    storageNamespace: convexUrl,
  })

  if (token) {
    client.setAuth(token)
  }

  const pageState = await client.query(api.characters.getCharacterPageState, {
    characterId: params.characterId as Id<"characters">,
  })

  redirectUnsupportedTracker(
    pageState.character,
    params.characterId as CharacterId,
  )

  return null
}

clientLoader.hydrate = true

export default function CharacterTrackerRoute() {
  const { pageState, handleSetActiveCharacter } = useCharacterRouteContext()
  const navigate = useNavigate()
  const character = pageState.character
  const trackerDefinition = character
    ? getTrackerDefinitionForCharacter(character)
    : undefined

  if (!character) {
    return <LoadingScreen detail="Loading your tracker." />
  }

  const TrackerRouteContent = trackerDefinition
    ? trackerRouteContentBySlug[trackerDefinition.trackerSlug]
    : undefined

  if (!TrackerRouteContent) {
    queueClientLoaderInfoToast(unsupportedTrackerToastMessage)
    return <Navigate replace to={getCharacterSheetPath(character._id)} />
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
    <TrackerRouteContent
      character={character}
      characters={pageState.characters}
      characterTrackerSettings={pageState.characterTrackerSettings}
      handleCharacterSwitch={handleCharacterSwitch}
    />
  )
}
