import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { Effect } from "effect"
import { mutation, query } from "./_generated/server"
import {
  clampCharacterLevel,
  normalizeCharacterName,
  normalizeClassName,
  normalizeSubclassName,
  resolveCharacterFlow,
  toClassSlug,
} from "./characterModel"

export const getAppState = query({
  args: {},
  handler: async (ctx) => {
    return await Effect.gen(function* () {
      const userId = yield* Effect.promise(() => getAuthUserId(ctx))

      if (!userId) {
        return {
          activeCharacterId: null,
          activeCharacter: null,
          activeTrackerSettings: null,
          characters: [],
        }
      }

      const characters = yield* Effect.promise(() =>
        ctx.db
          .query("characters")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .collect(),
      )
      const preferences = yield* Effect.promise(() =>
        ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
      )

      const activeCharacter =
        characters.find(
          (character) => character._id === preferences?.activeCharacterId,
        ) ??
        characters[0] ??
        null

      const activeTrackerSettings =
        activeCharacter?.trackerSlug === "rogue"
          ? yield* Effect.promise(() =>
              ctx.db
                .query("characterSettings")
                .withIndex("by_character_id", (q) =>
                  q.eq("characterId", activeCharacter._id),
                )
                .filter((q) => q.eq(q.field("trackerSlug"), "rogue"))
                .first(),
            )
          : null

      return {
        activeCharacterId: activeCharacter?._id ?? null,
        activeCharacter,
        activeTrackerSettings,
        characters,
      }
    }).pipe(Effect.runPromise)
  },
})

export const getCharacterPageState = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    return await Effect.gen(function* () {
      const userId = yield* Effect.promise(() => getAuthUserId(ctx))

      if (!userId) {
        return {
          activeCharacterId: null,
          character: null,
          characterTrackerSettings: null,
          characters: [],
        }
      }

      const characters = yield* Effect.promise(() =>
        ctx.db
          .query("characters")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .collect(),
      )
      const preferences = yield* Effect.promise(() =>
        ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
      )
      const character =
        characters.find((entry) => entry._id === args.characterId) ?? null
      const characterTrackerSettings =
        character?.trackerSlug === "rogue"
          ? yield* Effect.promise(() =>
              ctx.db
                .query("characterSettings")
                .withIndex("by_character_id", (q) =>
                  q.eq("characterId", character._id),
                )
                .filter((q) => q.eq(q.field("trackerSlug"), "rogue"))
                .first(),
            )
          : null

      return {
        activeCharacterId:
          preferences?.activeCharacterId ?? characters[0]?._id ?? null,
        character,
        characterTrackerSettings,
        characters,
      }
    }).pipe(Effect.runPromise)
  },
})

export const createCharacter = mutation({
  args: {
    name: v.string(),
    className: v.string(),
    subclassName: v.optional(v.string()),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    return await Effect.gen(function* () {
      const userId = yield* Effect.promise(() => getAuthUserId(ctx))

      if (!userId) {
        throw new Error("Authentication required")
      }

      const className = normalizeClassName(args.className)
      const classSlug = toClassSlug(className)
      const flow = resolveCharacterFlow(classSlug)
      const now = Date.now()
      const characterId = yield* Effect.promise(() =>
        ctx.db.insert("characters", {
          userId,
          name: normalizeCharacterName(args.name),
          className,
          classSlug,
          flowFamilySlug: flow.flowFamilySlug,
          trackerSlug: flow.trackerSlug,
          subclassName: normalizeSubclassName(args.subclassName),
          level: clampCharacterLevel(args.level),
          status: flow.status,
          createdAt: now,
          updatedAt: now,
        }),
      )

      const preferences = yield* Effect.promise(() =>
        ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
      )

      if (preferences) {
        yield* Effect.promise(() =>
          ctx.db.patch(preferences._id, { activeCharacterId: characterId }),
        )
      } else {
        yield* Effect.promise(() =>
          ctx.db.insert("userPreferences", {
            userId,
            activeCharacterId: characterId,
          }),
        )
      }

      if (flow.trackerSlug === "rogue") {
        const rogueSettings = yield* Effect.promise(() =>
          ctx.db
            .query("characterSettings")
            .withIndex("by_character_id", (q) =>
              q.eq("characterId", characterId),
            )
            .filter((q) => q.eq(q.field("trackerSlug"), "rogue"))
            .first(),
        )

        if (!rogueSettings) {
          yield* Effect.promise(() =>
            ctx.db.insert("characterSettings", {
              characterId,
              trackerSlug: "rogue",
              dexModifier: 0,
              applyDexToBothWeapons: false,
              updatedAt: now,
            }),
          )
        }
      }

      return characterId
    }).pipe(Effect.runPromise)
  },
})

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.string(),
    className: v.string(),
    subclassName: v.optional(v.string()),
    level: v.number(),
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

      const className = normalizeClassName(args.className)
      const classSlug = toClassSlug(className)
      const flow = resolveCharacterFlow(classSlug)
      const now = Date.now()

      yield* Effect.promise(() =>
        ctx.db.patch(args.characterId, {
          name: normalizeCharacterName(args.name),
          className,
          classSlug,
          flowFamilySlug: flow.flowFamilySlug,
          trackerSlug: flow.trackerSlug,
          subclassName: normalizeSubclassName(args.subclassName),
          level: clampCharacterLevel(args.level),
          status: flow.status,
          updatedAt: now,
        }),
      )

      if (flow.trackerSlug === "rogue") {
        const rogueSettings = yield* Effect.promise(() =>
          ctx.db
            .query("characterSettings")
            .withIndex("by_character_id", (q) =>
              q.eq("characterId", args.characterId),
            )
            .filter((q) => q.eq(q.field("trackerSlug"), "rogue"))
            .first(),
        )

        if (!rogueSettings) {
          yield* Effect.promise(() =>
            ctx.db.insert("characterSettings", {
              characterId: args.characterId,
              trackerSlug: "rogue",
              dexModifier: 0,
              applyDexToBothWeapons: false,
              updatedAt: now,
            }),
          )
        }
      }

      return args.characterId
    }).pipe(Effect.runPromise)
  },
})

export const setActiveCharacter = mutation({
  args: {
    characterId: v.id("characters"),
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

      const preferences = yield* Effect.promise(() =>
        ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
      )

      if (preferences) {
        yield* Effect.promise(() =>
          ctx.db.patch(preferences._id, {
            activeCharacterId: args.characterId,
          }),
        )
        return preferences._id
      }

      return yield* Effect.promise(() =>
        ctx.db.insert("userPreferences", {
          userId,
          activeCharacterId: args.characterId,
        }),
      )
    }).pipe(Effect.runPromise)
  },
})
