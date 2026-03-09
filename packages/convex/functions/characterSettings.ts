import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { Effect } from "effect"
import { mutation } from "./_generated/server"

export const upsertRogueSettings = mutation({
  args: {
    characterId: v.id("characters"),
    dexModifier: v.number(),
    applyDexToBothWeapons: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await Effect.gen(function* () {
      const userId = yield* Effect.promise(() => getAuthUserId(ctx))

      if (!userId) {
        throw new Error("Authentication required")
      }

      const character = yield* Effect.promise(() =>
        ctx.db.get(args.characterId),
      )

      if (!character || character.userId !== userId) {
        throw new Error("Character not found")
      }

      const existing = yield* Effect.promise(() =>
        ctx.db
          .query("characterSettings")
          .withIndex("by_character_id", (q) =>
            q.eq("characterId", args.characterId),
          )
          .filter((q) => q.eq(q.field("trackerSlug"), "rogue"))
          .first(),
      )

      const patch = {
        dexModifier: Math.min(
          10,
          Math.max(-5, Math.floor(args.dexModifier || 0)),
        ),
        applyDexToBothWeapons: args.applyDexToBothWeapons,
        updatedAt: Date.now(),
      }

      if (existing) {
        yield* Effect.promise(() => ctx.db.patch(existing._id, patch))
        return existing._id
      }

      return yield* Effect.promise(() =>
        ctx.db.insert("characterSettings", {
          characterId: args.characterId,
          trackerSlug: "rogue",
          ...patch,
        }),
      )
    }).pipe(Effect.runPromise)
  },
})
