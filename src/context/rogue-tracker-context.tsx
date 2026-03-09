import { createContext, type ReactNode, useContext } from "react"
import { hookApi } from "~/generated/convex-hook-api"
import type {
  CharacterRecord,
  RogueSettingsRecord,
} from "~/lib/character-record"
import {
  clampDexModifier,
  getSneakAttackDiceCount,
  type RogueTrackerSettings,
} from "~/lib/rogue-tracker"

interface RogueTrackerContextValue {
  activeCharacter: CharacterRecord
  saveSettings: (settings: RogueTrackerSettings) => Promise<void>
  settings: RogueTrackerSettings
  sneakAttackDiceCount: number
  daggerModifier: number
}

const RogueTrackerContext = createContext<RogueTrackerContextValue | undefined>(
  undefined,
)

const buildSettings = (
  character: CharacterRecord,
  rogueSettings: RogueSettingsRecord | null,
): RogueTrackerSettings => ({
  level: character.level,
  dexModifier: clampDexModifier(rogueSettings?.dexModifier ?? 0),
  applyDexToBothWeapons: rogueSettings?.applyDexToBothWeapons ?? false,
})

export function RogueTrackerProvider({
  character,
  rogueSettings,
  children,
}: {
  character: CharacterRecord
  rogueSettings: RogueSettingsRecord | null
  children: ReactNode
}) {
  const persistSettings =
    hookApi.mutations.characterSettings.useUpsertRogueSettings()
  const settings = buildSettings(character, rogueSettings)

  const saveSettings = async (nextSettings: RogueTrackerSettings) => {
    await persistSettings({
      characterId: character._id,
      dexModifier: clampDexModifier(nextSettings.dexModifier),
      applyDexToBothWeapons: nextSettings.applyDexToBothWeapons,
    })
  }

  const value = {
    activeCharacter: character,
    saveSettings,
    settings,
    sneakAttackDiceCount: getSneakAttackDiceCount(character.level),
    daggerModifier: settings.applyDexToBothWeapons ? settings.dexModifier : 0,
  }

  return (
    <RogueTrackerContext.Provider value={value}>
      {children}
    </RogueTrackerContext.Provider>
  )
}

export function useRogueTracker() {
  const context = useContext(RogueTrackerContext)
  if (!context) {
    throw new Error("useRogueTracker must be used within RogueTrackerProvider")
  }

  return context
}
