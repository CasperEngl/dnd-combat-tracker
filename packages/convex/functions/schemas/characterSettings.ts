import { defineTable } from "convex/server"
import { v } from "convex/values"

export const characterSettingsTable = defineTable({
  characterId: v.id("characters"),
  trackerSlug: v.string(),
  dexModifier: v.number(),
  applyDexToBothWeapons: v.boolean(),
  updatedAt: v.number(),
})
  .index("by_character_id", ["characterId"])
  .index("by_character_id_and_tracker", ["characterId", "trackerSlug"])
