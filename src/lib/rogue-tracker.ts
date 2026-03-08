import { clampCharacterLevel } from "~/lib/character-model"

export interface RogueTrackerSettings {
  level: number
  dexModifier: number
  applyDexToBothWeapons: boolean
}

export const rogueTrackerDefaults: RogueTrackerSettings = {
  level: 1,
  dexModifier: 0,
  applyDexToBothWeapons: false,
}

export const clampDexModifier = (value: number) =>
  Math.min(10, Math.max(-5, Math.floor(value || 0)))

export const getSneakAttackDiceCount = (level: number) =>
  Math.ceil(clampCharacterLevel(level) / 2)
