import { Navigate, useNavigate } from "react-router"
import { CreateCharacterForm } from "~/components/create-character-form"
import { LoadingScreen } from "~/components/loading-screen"
import { hookApi } from "~/generated/convex-hook-api"

import type { CharacterFormValues } from "~/lib/character-record"
import { getCreatedCharacterPath } from "~/lib/character-routing"

export default function NewCharacterRoute() {
  const { isAuthenticated, isLoading } = hookApi.auth.useState()
  const appState = hookApi.queries.characters.useAppState()
  const createCharacter = hookApi.mutations.characters.useCreateCharacter()
  const navigate = useNavigate()

  if (isLoading || (isAuthenticated && appState === undefined)) {
    return <LoadingScreen detail="Loading your character library." />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/sign-in" />
  }

  const handleCreateCharacter = async (values: CharacterFormValues) => {
    const characterId = await createCharacter({
      name: values.name,
      className: values.className,
      subclassName: values.subclassName,
      level: values.level,
    })

    await navigate(getCreatedCharacterPath(values, characterId))
  }

  return <CreateCharacterForm onSubmit={handleCreateCharacter} />
}
