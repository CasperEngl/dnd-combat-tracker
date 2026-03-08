import { useAuthActions } from "@convex-dev/auth/react"
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react"
import { AuthForm } from "~/components/auth-form"
import { CreateCharacterForm } from "~/components/create-character-form"
import { TrackerScreen } from "~/components/tracker-screen"
import { UnsupportedCharacterScreen } from "~/components/unsupported-character-screen"
import { DamageEntryProvider } from "~/context/damage-entry-context"
import { RogueTrackerProvider } from "~/context/rogue-tracker-context"
import type { CharacterFormValues } from "~/lib/character-record"
import { convexApi } from "~/lib/convex-api"

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-950 px-4 text-warm-100">
      <div className="rounded-2xl border border-warm-700 bg-warm-900 px-5 py-4 text-center">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
          Loading
        </p>
        <p className="mt-2 text-sm text-warm-300">Syncing your roster.</p>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const appState = useQuery(convexApi.characters.getAppState)
  const createCharacter = useMutation(convexApi.characters.createCharacter)
  const updateCharacter = useMutation(convexApi.characters.updateCharacter)
  const setActiveCharacter = useMutation(
    convexApi.characters.setActiveCharacter,
  )
  const { signOut } = useAuthActions()

  if (!appState) {
    return <LoadingScreen />
  }

  const handleCreateCharacter = async (values: CharacterFormValues) => {
    await createCharacter({
      name: values.name,
      className: values.className,
      subclassName: values.subclassName,
      level: values.level,
    })
  }

  if (appState.characters.length === 0) {
    return <CreateCharacterForm onSubmit={handleCreateCharacter} />
  }

  const activeCharacter = appState.activeCharacter ?? appState.characters[0]

  const handleUpdateCharacter = async (values: CharacterFormValues) => {
    await updateCharacter({
      characterId: activeCharacter._id,
      name: values.name,
      className: values.className,
      subclassName: values.subclassName,
      level: values.level,
    })
  }

  const handleSetActiveCharacter = async (characterId: string) => {
    await setActiveCharacter({ characterId })
  }

  if (activeCharacter.turnMachineSlug !== "rogue") {
    return (
      <UnsupportedCharacterScreen
        activeCharacter={activeCharacter}
        characters={appState.characters}
        onCreateCharacter={handleCreateCharacter}
        onSetActiveCharacter={handleSetActiveCharacter}
        onSignOut={signOut}
        onUpdateCharacter={handleUpdateCharacter}
      />
    )
  }

  return (
    <RogueTrackerProvider
      character={activeCharacter}
      key={activeCharacter._id}
      rogueSettings={appState.activeRogueSettings}
    >
      <DamageEntryProvider>
        <TrackerScreen
          activeCharacter={activeCharacter}
          characters={appState.characters}
          onCreateCharacter={handleCreateCharacter}
          onSetActiveCharacter={handleSetActiveCharacter}
          onSignOut={signOut}
          onUpdateCharacter={handleUpdateCharacter}
        />
      </DamageEntryProvider>
    </RogueTrackerProvider>
  )
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </>
  )
}
