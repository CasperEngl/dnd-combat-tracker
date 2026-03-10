import { defineTable } from "convex/server"
import { v } from "convex/values"

export const userPreferencesTable = defineTable({
  userId: v.id("users"),
  activeCharacterId: v.id("characters"),
}).index("by_user_id", ["userId"])
