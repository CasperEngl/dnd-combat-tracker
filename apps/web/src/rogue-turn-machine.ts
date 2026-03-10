import { assign, setup } from "xstate"

export type BonusActionChoice = "disengage" | "hide" | "dash"

export interface AttackResult {
  id: "shortsword" | "nick"
  label: string
  hit: boolean | null
  hadAdvantage: boolean
  weaponDamage: number
  sneakAttackDamage: number
  totalDamage: number
  summary: string
}

export interface RogueTurnContext {
  sneakAttackAvailable: boolean
  vexAdvantageQueued: boolean
  damageTotal: number
  bonusAction: BonusActionChoice | null
  shortsword: AttackResult
  nick: AttackResult
}

export type RogueTurnEvent =
  | { type: "START_TURN" }
  | {
      type: "RESOLVE_SHORTSWORD"
      hit: boolean
      weaponDamage: number
      sneakAttackDamage: number
    }
  | {
      type: "RESOLVE_NICK"
      hit: boolean
      weaponDamage: number
      sneakAttackDamage: number
    }
  | { type: "CHOOSE_BONUS_ACTION"; choice: BonusActionChoice }
  | { type: "RESET" }

const clampDamage = (value: number) => Math.max(0, Math.floor(value || 0))

const createAttackResult = (
  id: AttackResult["id"],
  label: string,
): AttackResult => ({
  id,
  label,
  hit: null,
  hadAdvantage: false,
  weaponDamage: 0,
  sneakAttackDamage: 0,
  totalDamage: 0,
  summary: "Not resolved yet.",
})

const createInitialContext = (): RogueTurnContext => ({
  sneakAttackAvailable: true,
  vexAdvantageQueued: false,
  damageTotal: 0,
  bonusAction: null,
  shortsword: createAttackResult("shortsword", "Shortsword - Vex"),
  nick: createAttackResult("nick", "Dagger - Nick"),
})

export const rogueTurnMachine = setup({
  types: {
    context: {} as RogueTurnContext,
    events: {} as RogueTurnEvent,
  },
  actions: {
    resetTurn: assign(() => createInitialContext()),
    recordShortsword: assign(({ event }) => {
      if (event.type !== "RESOLVE_SHORTSWORD") {
        return {}
      }

      if (!event.hit) {
        return {
          shortsword: {
            id: "shortsword",
            label: "Shortsword - Vex",
            hit: false,
            hadAdvantage: false,
            weaponDamage: 0,
            sneakAttackDamage: 0,
            totalDamage: 0,
            summary:
              "Missed. No damage dealt and Vex does not grant advantage.",
          },
          vexAdvantageQueued: false,
          sneakAttackAvailable: true,
        }
      }

      const weaponDamage = clampDamage(event.weaponDamage)
      const sneakAttackDamage = clampDamage(event.sneakAttackDamage)
      const totalDamage = weaponDamage + sneakAttackDamage

      return {
        damageTotal: totalDamage,
        sneakAttackAvailable: sneakAttackDamage === 0,
        vexAdvantageQueued: true,
        shortsword: {
          id: "shortsword",
          label: "Shortsword - Vex",
          hit: true,
          hadAdvantage: false,
          weaponDamage,
          sneakAttackDamage,
          totalDamage,
          summary:
            sneakAttackDamage > 0
              ? "Hit. Sneak Attack lands here, and Vex grants advantage on the Nick attack."
              : "Hit. Shortsword damage lands, Vex grants advantage on Nick, and Sneak Attack can still land on a later hit.",
        },
      }
    }),
    recordNick: assign(({ context, event }) => {
      if (event.type !== "RESOLVE_NICK") {
        return {}
      }

      const hadAdvantage = context.vexAdvantageQueued

      if (!event.hit) {
        return {
          vexAdvantageQueued: false,
          nick: {
            id: "nick",
            label: "Dagger - Nick",
            hit: false,
            hadAdvantage,
            weaponDamage: 0,
            sneakAttackDamage: 0,
            totalDamage: 0,
            summary: hadAdvantage
              ? "Missed even with advantage from Vex."
              : "Missed. No dagger damage dealt.",
          },
        }
      }

      const weaponDamage = clampDamage(event.weaponDamage)
      const sneakAttackDamage = context.sneakAttackAvailable
        ? clampDamage(event.sneakAttackDamage)
        : 0
      const totalDamage = weaponDamage + sneakAttackDamage

      return {
        damageTotal: context.damageTotal + totalDamage,
        sneakAttackAvailable:
          context.sneakAttackAvailable && sneakAttackDamage === 0,
        vexAdvantageQueued: false,
        nick: {
          id: "nick",
          label: "Dagger - Nick",
          hit: true,
          hadAdvantage,
          weaponDamage,
          sneakAttackDamage,
          totalDamage,
          summary:
            sneakAttackDamage > 0
              ? "Hit. Dagger damage lands and Sneak Attack is applied here."
              : hadAdvantage
                ? "Hit with advantage from Vex. Dagger damage lands without Sneak Attack."
                : "Hit. Dagger damage lands without Sneak Attack.",
        },
      }
    }),
    recordBonusAction: assign(({ event }) => {
      if (event.type !== "CHOOSE_BONUS_ACTION") {
        return {}
      }

      return {
        bonusAction: event.choice,
      }
    }),
  },
}).createMachine({
  id: "rogueTurn",
  initial: "idle",
  context: createInitialContext,
  states: {
    idle: {
      on: {
        START_TURN: {
          target: "shortswordAttack",
          actions: "resetTurn",
        },
      },
    },
    shortswordAttack: {
      on: {
        RESOLVE_SHORTSWORD: {
          target: "nickAttack",
          actions: "recordShortsword",
        },
        RESET: {
          target: "idle",
          actions: "resetTurn",
        },
      },
    },
    nickAttack: {
      on: {
        RESOLVE_NICK: {
          target: "bonusActionChoice",
          actions: "recordNick",
        },
        RESET: {
          target: "idle",
          actions: "resetTurn",
        },
      },
    },
    bonusActionChoice: {
      on: {
        CHOOSE_BONUS_ACTION: {
          target: "turnEnded",
          actions: "recordBonusAction",
        },
        RESET: {
          target: "idle",
          actions: "resetTurn",
        },
      },
    },
    turnEnded: {
      on: {
        START_TURN: {
          target: "shortswordAttack",
          actions: "resetTurn",
        },
        RESET: {
          target: "idle",
          actions: "resetTurn",
        },
      },
    },
  },
})
