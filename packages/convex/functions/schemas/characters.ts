import { defineTable } from "convex/server"
import { v } from "convex/values"

export const charactersTable = defineTable({
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
}).index("by_user_id", ["userId"])
