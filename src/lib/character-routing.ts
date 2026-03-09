import {
  normalizeClassName,
  resolveTurnMachineSlug,
  toClassSlug,
} from "~/lib/character-model"
import type {
  AppStateRecord,
  CharacterFormValues,
  CharacterId,
  CharacterRecord,
} from "~/lib/character-record"

export const getCharacterPath = (characterId: CharacterId) =>
  `/characters/${characterId}`

export const getCharacterSheetPath = (characterId: CharacterId) =>
  `/characters/${characterId}/sheet`

export const isTrackerSupported = (character: CharacterRecord) =>
  character.turnMachineSlug === "rogue"

export const getCanonicalCharacterPath = (character: CharacterRecord) =>
  isTrackerSupported(character)
    ? getCharacterPath(character._id)
    : getCharacterSheetPath(character._id)

export const getCreatedCharacterPath = (
  values: CharacterFormValues,
  characterId: CharacterId,
) =>
  resolveTurnMachineSlug(toClassSlug(normalizeClassName(values.className))) ===
  "rogue"
    ? getCharacterPath(characterId)
    : getCharacterSheetPath(characterId)

export const getHomeRedirectTarget = (appState: AppStateRecord) => {
  if (appState.characters.length === 0) {
    return "/characters/new"
  }

  return getCanonicalCharacterPath(
    appState.activeCharacter ?? appState.characters[0],
  )
}
