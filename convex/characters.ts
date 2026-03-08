import { getAuthUserId } from "@convex-dev/auth/server"
import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"
import { Effect } from "effect"
import {
  clampCharacterLevel,
  normalizeCharacterName,
  normalizeClassName,
  normalizeSubclassName,
  resolveCharacterStatus,
  resolveTurnMachineSlug,
  toClassSlug,
} from "./character_model"

export const getAppState = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await Effect.gen(function* () {
      const userId = yield* Effect.promise(() => getAuthUserId(ctx))

      if (!userId) {
        return {
          activeCharacter: null,
          activeRogueSettings: null,
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

      const activeRogueSettings =
        activeCharacter?.turnMachineSlug === "rogue"
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
        activeCharacter,
        activeRogueSettings,
        characters,
      }
    }).pipe(Effect.runPromise)
  },
})

export const createCharacter = mutationGeneric({
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
      const turnMachineSlug = resolveTurnMachineSlug(classSlug)
      const now = Date.now()
      const characterId = yield* Effect.promise(() =>
        ctx.db.insert("characters", {
          userId,
          name: normalizeCharacterName(args.name),
          className,
          classSlug,
          subclassName: normalizeSubclassName(args.subclassName),
          level: clampCharacterLevel(args.level),
          turnMachineSlug,
          status: resolveCharacterStatus(turnMachineSlug),
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

      if (turnMachineSlug === "rogue") {
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

export const updateCharacter = mutationGeneric({
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
      const turnMachineSlug = resolveTurnMachineSlug(classSlug)
      const now = Date.now()

      yield* Effect.promise(() =>
        ctx.db.patch(args.characterId, {
          name: normalizeCharacterName(args.name),
          className,
          classSlug,
          subclassName: normalizeSubclassName(args.subclassName),
          level: clampCharacterLevel(args.level),
          turnMachineSlug,
          status: resolveCharacterStatus(turnMachineSlug),
          updatedAt: now,
        }),
      )

      if (turnMachineSlug === "rogue") {
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

export const setActiveCharacter = mutationGeneric({
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
