import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ...authTables,
  characters: defineTable({
    userId: v.id("users"),
    name: v.string(),
    className: v.string(),
    classSlug: v.string(),
    flowFamilySlug: v.optional(v.string()),
    trackerSlug: v.optional(v.string()),
    subclassName: v.optional(v.string()),
    level: v.number(),
    status: v.union(
      v.literal("ready"),
      v.literal("needs-tracker"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),
  characterSettings: defineTable({
    characterId: v.id("characters"),
    trackerSlug: v.string(),
    dexModifier: v.number(),
    applyDexToBothWeapons: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_character_id", ["characterId"])
    .index("by_character_id_and_tracker", ["characterId", "trackerSlug"]),
  userPreferences: defineTable({
    userId: v.id("users"),
    activeCharacterId: v.id("characters"),
  }).index("by_user_id", ["userId"]),
})
