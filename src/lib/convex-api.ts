import { makeFunctionReference } from "convex/server"
import type {
  AppStateRecord,
  CharacterFormValues,
} from "~/lib/character-record"

type CharacterMutationArgs = {
  name: CharacterFormValues["name"]
  className: CharacterFormValues["className"]
  subclassName: CharacterFormValues["subclassName"]
  level: CharacterFormValues["level"]
}

type SaveRogueSettingsArgs = Record<string, boolean | number | string> & {
  characterId: string
  dexModifier: number
  applyDexToBothWeapons: boolean
}

export const convexApi = {
  characters: {
    getAppState: makeFunctionReference<
      "query",
      Record<string, never>,
      AppStateRecord
    >("characters:getAppState"),
    createCharacter: makeFunctionReference<
      "mutation",
      CharacterMutationArgs,
      string
    >("characters:createCharacter"),
    updateCharacter: makeFunctionReference<
      "mutation",
      CharacterMutationArgs & { characterId: string },
      string
    >("characters:updateCharacter"),
    setActiveCharacter: makeFunctionReference<
      "mutation",
      { characterId: string },
      string
    >("characters:setActiveCharacter"),
  },
  characterSettings: {
    upsertRogueSettings: makeFunctionReference<
      "mutation",
      SaveRogueSettingsArgs,
      string
    >("character_settings:upsertRogueSettings"),
  },
}
