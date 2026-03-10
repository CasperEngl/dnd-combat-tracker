import type { api } from "@dnd-combat-tracker/convex"
import type { Doc, Id } from "@dnd-combat-tracker/convex/data-model"
import type { FunctionArgs, FunctionReturnType } from "convex/server"

export type CharacterId = Id<"characters">
export type CharacterSettingsId = Id<"characterSettings">
export type CharacterRecord = Doc<"characters">
export type RogueSettingsRecord = Doc<"characterSettings">
export type AppStateRecord = FunctionReturnType<
  typeof api.characters.getAppState
>
export type CharacterPageStateRecord = FunctionReturnType<
  typeof api.characters.getCharacterPageState
>
export type CharacterMutationValues = FunctionArgs<
  typeof api.characters.createCharacter
>
export type CharacterFormValues = Omit<
  CharacterMutationValues,
  "subclassName"
> & {
  subclassName: string
}

export const getCharacterSummary = (character: CharacterRecord) =>
  character.subclassName
    ? `${character.subclassName} ${character.className}`
    : character.className
