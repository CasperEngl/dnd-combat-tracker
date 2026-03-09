import { Navigate, Outlet, useOutletContext, useParams } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { convexApi } from "~/generated/convex-api"

import type {
  CharacterFormValues,
  CharacterId,
  CharacterPageStateRecord,
} from "~/lib/character-record"
import { getCanonicalCharacterPath } from "~/lib/character-routing"

type CharacterRouteContext = {
  pageState: CharacterPageStateRecord
  handleCreateCharacter: (values: CharacterFormValues) => Promise<CharacterId>
  handleSetActiveCharacter: (characterId: CharacterId) => Promise<void>
  handleUpdateCharacter: (values: CharacterFormValues) => Promise<void>
}

export default function CharacterRouteLayout() {
  const characterId = useCharacterId()
  const { isAuthenticated, isLoading } = convexApi.auth.useState()
  const pageState = convexApi.queries.characters.useCharacterPageState({
    characterId,
  })
  const createCharacter = convexApi.mutations.characters.useCreateCharacter()
  const updateCharacter = convexApi.mutations.characters.useUpdateCharacter()
  const setActiveCharacter =
    convexApi.mutations.characters.useSetActiveCharacter()

  if (isLoading || (isAuthenticated && pageState === undefined)) {
    return <LoadingScreen detail="Loading your character." />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/sign-in" />
  }

  if (!pageState) {
    return <LoadingScreen detail="Loading your character." />
  }

  if (pageState.characters.length === 0) {
    return <Navigate replace to="/characters/new" />
  }

  if (!pageState.character) {
    return (
      <Navigate
        replace
        to={getCanonicalCharacterPath(
          pageState.characters.find(
            (character) => character._id === pageState.activeCharacterId,
          ) ?? pageState.characters[0],
        )}
      />
    )
  }

  const handleCreateCharacter = async (values: CharacterFormValues) =>
    await createCharacter({
      name: values.name,
      className: values.className,
      subclassName: values.subclassName,
      level: values.level,
    })

  const handleSetActiveCharacter = async (nextCharacterId: CharacterId) => {
    await setActiveCharacter({ characterId: nextCharacterId })
  }

  const handleUpdateCharacter = async (values: CharacterFormValues) => {
    await updateCharacter({
      characterId,
      name: values.name,
      className: values.className,
      subclassName: values.subclassName,
      level: values.level,
    })
  }

  return (
    <Outlet
      context={{
        pageState,
        handleCreateCharacter,
        handleSetActiveCharacter,
        handleUpdateCharacter,
      }}
    />
  )
}

export function useCharacterRouteContext() {
  return useOutletContext<CharacterRouteContext>()
}

function useCharacterId() {
  const params = useParams()

  if (!params.characterId) {
    throw new Error("Character route is missing a character id")
  }

  return params.characterId as CharacterId
}
