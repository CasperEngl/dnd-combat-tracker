import { describe, expect, test } from "bun:test"
import { createActor } from "xstate"
import { rogueTurnMachine } from "~/rogue-turn-machine"

describe("rogue turn machine", () => {
  test("keeps sneak attack available after a shortsword hit without sneak attack", () => {
    const actor = createActor(rogueTurnMachine)

    actor.start()
    actor.send({ type: "START_TURN" })
    actor.send({
      type: "RESOLVE_SHORTSWORD",
      hit: true,
      weaponDamage: 6,
      sneakAttackDamage: 0,
    })

    const snapshot = actor.getSnapshot()

    expect(snapshot.context.sneakAttackAvailable).toBe(true)
    expect(snapshot.context.shortsword.sneakAttackDamage).toBe(0)
    expect(snapshot.context.shortsword.summary).toContain(
      "Sneak Attack can still land",
    )
  })

  test("spends sneak attack only when damage is applied", () => {
    const actor = createActor(rogueTurnMachine)

    actor.start()
    actor.send({ type: "START_TURN" })
    actor.send({
      type: "RESOLVE_SHORTSWORD",
      hit: true,
      weaponDamage: 6,
      sneakAttackDamage: 0,
    })
    actor.send({
      type: "RESOLVE_NICK",
      hit: true,
      weaponDamage: 4,
      sneakAttackDamage: 10,
    })

    const snapshot = actor.getSnapshot()

    expect(snapshot.context.sneakAttackAvailable).toBe(false)
    expect(snapshot.context.nick.sneakAttackDamage).toBe(10)
    expect(snapshot.context.damageTotal).toBe(20)
  })
})
