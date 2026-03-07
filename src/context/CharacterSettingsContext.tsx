import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  type CharacterSettings,
  getSneakAttackDiceCount,
  loadCharacterSettings,
  saveCharacterSettings,
} from "~/lib/character-settings"

interface CharacterSettingsContextValue {
  settings: CharacterSettings
  setSettings: Dispatch<SetStateAction<CharacterSettings>>
  sneakAttackDiceCount: number
  daggerModifier: number
}

const CharacterSettingsContext = createContext<
  CharacterSettingsContextValue | undefined
>(undefined)

export function CharacterSettingsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [settings, setSettings] = useState<CharacterSettings>(() =>
    loadCharacterSettings(),
  )

  useEffect(() => {
    saveCharacterSettings(settings)
  }, [settings])

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      sneakAttackDiceCount: getSneakAttackDiceCount(settings.rogueLevel),
      daggerModifier: settings.applyDexToBothWeapons ? settings.dexModifier : 0,
    }),
    [settings],
  )

  return (
    <CharacterSettingsContext.Provider value={value}>
      {children}
    </CharacterSettingsContext.Provider>
  )
}

export function useCharacterSettings() {
  const context = useContext(CharacterSettingsContext)
  if (!context) {
    throw new Error(
      "useCharacterSettings must be used within CharacterSettingsProvider",
    )
  }

  return context
}
