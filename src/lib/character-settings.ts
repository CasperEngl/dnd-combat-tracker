export interface CharacterSettings {
  rogueLevel: number
  dexModifier: number
  applyDexToBothWeapons: boolean
}

export const characterSettingsDefaults: CharacterSettings = {
  rogueLevel: 1,
  dexModifier: 0,
  applyDexToBothWeapons: false,
}

export const characterSettingsStorageKeys = {
  rogueLevel: "rogue-roll-flow.level",
  dexModifier: "rogue-roll-flow.dexModifier",
  applyDexToBothWeapons: "rogue-roll-flow.applyDexToBothWeapons",
} as const

export const clampRogueLevel = (value: number) =>
  Math.min(
    20,
    Math.max(1, Math.floor(value || characterSettingsDefaults.rogueLevel)),
  )

export const clampDexModifier = (value: number) =>
  Math.min(10, Math.max(-5, Math.floor(value || 0)))

const readStoredNumber = (
  key: string,
  fallback: number,
  clamp: (value: number) => number,
) => {
  if (typeof window === "undefined") {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (raw === null) {
    return fallback
  }

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? clamp(parsed) : fallback
}

const readStoredBoolean = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (raw === null) {
    return fallback
  }

  return raw === "true"
}

export const loadCharacterSettings = (): CharacterSettings => ({
  rogueLevel: readStoredNumber(
    characterSettingsStorageKeys.rogueLevel,
    characterSettingsDefaults.rogueLevel,
    clampRogueLevel,
  ),
  dexModifier: readStoredNumber(
    characterSettingsStorageKeys.dexModifier,
    characterSettingsDefaults.dexModifier,
    clampDexModifier,
  ),
  applyDexToBothWeapons: readStoredBoolean(
    characterSettingsStorageKeys.applyDexToBothWeapons,
    characterSettingsDefaults.applyDexToBothWeapons,
  ),
})

export const saveCharacterSettings = (settings: CharacterSettings) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    characterSettingsStorageKeys.rogueLevel,
    `${clampRogueLevel(settings.rogueLevel)}`,
  )
  window.localStorage.setItem(
    characterSettingsStorageKeys.dexModifier,
    `${clampDexModifier(settings.dexModifier)}`,
  )
  window.localStorage.setItem(
    characterSettingsStorageKeys.applyDexToBothWeapons,
    `${settings.applyDexToBothWeapons}`,
  )
}

export const getSneakAttackDiceCount = (rogueLevel: number) =>
  Math.ceil(clampRogueLevel(rogueLevel) / 2)
