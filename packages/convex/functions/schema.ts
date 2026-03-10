import { authTables } from "@convex-dev/auth/server"
import { defineSchema } from "convex/server"
import { characterSettingsTable } from "./schemas/characterSettings"
import { charactersTable } from "./schemas/characters"
import { userPreferencesTable } from "./schemas/userPreferences"

export default defineSchema({
  ...authTables,
  characters: charactersTable,
  characterSettings: characterSettingsTable,
  userPreferences: userPreferencesTable,
})
