import { api } from "@convex/_generated/api"
import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { createContext, type ReactNode, useContext } from "react"
import type { CharacterId } from "~/lib/character-record"

const defaultAppServices = {
  authActions: () => {
    const { signIn, signOut } = useConvexAuthActions()

    return { signIn, signOut }
  },
  authState: useConvexAuth,
  appState: () => useQuery(api.characters.getAppState),
  characterPageState: (characterId: CharacterId) =>
    useQuery(api.characters.getCharacterPageState, {
      characterId,
    }),
  createCharacter: () => {
    const mutate = useMutation(api.characters.createCharacter)

    return (values: Parameters<typeof mutate>[0]) => mutate(values)
  },
  updateCharacter: () => {
    const mutate = useMutation(api.characters.updateCharacter)

    return (values: Parameters<typeof mutate>[0]) => mutate(values)
  },
  setActiveCharacter: () => {
    const mutate = useMutation(api.characters.setActiveCharacter)

    return (values: Parameters<typeof mutate>[0]) => mutate(values)
  },
  upsertRogueSettings: () => {
    const mutate = useMutation(api.characterSettings.upsertRogueSettings)

    return (values: Parameters<typeof mutate>[0]) => mutate(values)
  },
}

export type AppServices = typeof defaultAppServices

const AppServicesContext = createContext<AppServices>(defaultAppServices)

export function AppServicesProvider({
  children,
  value,
}: {
  children: ReactNode
  value: AppServices
}) {
  return (
    <AppServicesContext.Provider value={value}>
      {children}
    </AppServicesContext.Provider>
  )
}

export function useAuthActions() {
  return useContext(AppServicesContext).authActions()
}

export function useAuthState() {
  return useContext(AppServicesContext).authState()
}

export function useAppState() {
  return useContext(AppServicesContext).appState()
}

export function useCharacterPageState(characterId: CharacterId) {
  return useContext(AppServicesContext).characterPageState(characterId)
}

export function useCreateCharacter() {
  return useContext(AppServicesContext).createCharacter()
}

export function useUpdateCharacter() {
  return useContext(AppServicesContext).updateCharacter()
}

export function useSetActiveCharacter() {
  return useContext(AppServicesContext).setActiveCharacter()
}

export function useUpsertRogueSettings() {
  return useContext(AppServicesContext).upsertRogueSettings()
}
