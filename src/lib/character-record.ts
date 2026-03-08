export interface CharacterRecord {
  _id: string
  name: string
  className: string
  classSlug: string
  subclassName?: string
  level: number
  turnMachineSlug?: string
  status: "ready" | "needs-tracker" | "archived"
}

export interface RogueSettingsRecord {
  _id?: string
  characterId: string
  trackerSlug: "rogue"
  dexModifier: number
  applyDexToBothWeapons: boolean
}

export interface AppStateRecord {
  activeCharacter: CharacterRecord | null
  activeRogueSettings: RogueSettingsRecord | null
  characters: CharacterRecord[]
}

export interface CharacterFormValues {
  name: string
  className: string
  subclassName: string
  level: number
}

export const getCharacterSummary = (character: CharacterRecord) =>
  character.subclassName
    ? `${character.subclassName} ${character.className}`
    : character.className
