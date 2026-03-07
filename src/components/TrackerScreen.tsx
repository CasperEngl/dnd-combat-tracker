import { useMachine } from "@xstate/react"
import { useEffect, useState } from "react"
import { SettingsPane } from "~/components/SettingsPane"
import {
  AttackHeader,
  DicePoolSelector,
  DieSelector,
  HitMissButtons,
} from "~/components/tracker/AttackControls"
import {
  BonusActionPanel,
  IntroPanel,
  TurnEndPanel,
} from "~/components/tracker/FlowPanels"
import { HeaderBar, type TurnPhase } from "~/components/tracker/HeaderBar"
import { Sidebar } from "~/components/tracker/Sidebar"
import { useCharacterSettings } from "~/context/CharacterSettingsContext"
import { useDamageEntry } from "~/context/DamageEntryContext"
import { allDiceSelected } from "~/lib/dice"
import { rogueTurnMachine } from "~/rogueTurnMachine"

const getShortswordHitHint = (
  weaponDieSelected: boolean,
  sneakAttackReady: boolean,
) => {
  if (!weaponDieSelected && !sneakAttackReady) {
    return "Choose the shortsword die and each Sneak Attack die before confirming a hit."
  }

  if (!weaponDieSelected) {
    return "Choose the shortsword die before confirming a hit."
  }

  if (!sneakAttackReady) {
    return "Choose each Sneak Attack die before confirming a hit."
  }

  return null
}

const getNickHitHint = (
  weaponDieSelected: boolean,
  sneakAttackAvailable: boolean,
  sneakAttackReady: boolean,
) => {
  if (!weaponDieSelected && sneakAttackAvailable && !sneakAttackReady) {
    return "Choose the dagger die and each Sneak Attack die before confirming a hit."
  }

  if (!weaponDieSelected) {
    return "Choose the dagger die before confirming a hit."
  }

  if (sneakAttackAvailable && !sneakAttackReady) {
    return "Choose each Sneak Attack die before confirming a hit."
  }

  return null
}

export function TrackerScreen() {
  const [snapshot, send] = useMachine(rogueTurnMachine)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, setSettings, sneakAttackDiceCount, daggerModifier } =
    useCharacterSettings()
  const {
    shortswordWeaponDie,
    setShortswordWeaponDie,
    shortswordSneakDice,
    setShortswordSneakDie,
    nickWeaponDie,
    setNickWeaponDie,
    nickSneakDice,
    setNickSneakDie,
    shortswordWeaponDamage,
    nickWeaponDamage,
    shortswordSneakDamage,
    nickSneakDamage,
    isShortswordHitReady,
    isNickSneakReady,
    resetSelections,
  } = useDamageEntry()

  const currentPhase = snapshot.value as TurnPhase
  const { context } = snapshot
  const selectionResetToken = `${currentPhase}:${settings.rogueLevel}:${settings.dexModifier}:${settings.applyDexToBothWeapons}`

  useEffect(() => {
    void selectionResetToken
    resetSelections()
  }, [resetSelections, selectionResetToken])

  const resolvedAttacks = [context.shortsword, context.nick].filter(
    (attack) => attack.hit !== null,
  )
  const isNickHitReady =
    nickWeaponDie !== null &&
    (!context.sneakAttackAvailable || isNickSneakReady)

  return (
    <>
      <SettingsPane
        onOpenChange={setSettingsOpen}
        onSettingsChange={setSettings}
        open={settingsOpen}
        settings={settings}
      />

      <div className="flex min-h-screen flex-col overflow-hidden bg-warm-950 text-warm-100">
        <HeaderBar
          currentPhase={currentPhase}
          onOpenSettings={() => setSettingsOpen(true)}
          onReset={() => send({ type: "RESET" })}
          settings={settings}
        />

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[1fr_240px]">
          <div className="min-h-0 overflow-y-auto">
            <div className="flex min-h-full flex-col gap-2.5">
              {currentPhase === "idle" && (
                <IntroPanel onStart={() => send({ type: "START_TURN" })} />
              )}

              {currentPhase === "shortswordAttack" && (
                <>
                  <AttackHeader
                    note="On hit, Sneak Attack lands here and Vex grants advantage on Nick."
                    noteActive
                    title="Action: Shortsword (Vex)"
                  />
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    <DieSelector
                      dieSides={6}
                      hint="Choose the raw d6 result. Dex is added automatically."
                      label="Shortsword roll"
                      modifier={settings.dexModifier}
                      onChange={setShortswordWeaponDie}
                      total={shortswordWeaponDamage}
                      totalLabel="Weapon damage"
                      value={shortswordWeaponDie}
                    />
                    <DicePoolSelector
                      dieSides={6}
                      hint="Choose each Sneak Attack die separately."
                      label={`Sneak Attack (${sneakAttackDiceCount}d6)`}
                      onChange={setShortswordSneakDie}
                      subtotal={shortswordSneakDamage}
                      values={shortswordSneakDice}
                    />
                  </div>
                  <HitMissButtons
                    hitDisabled={!isShortswordHitReady}
                    hitHint={getShortswordHitHint(
                      shortswordWeaponDie !== null,
                      allDiceSelected(shortswordSneakDice),
                    )}
                    onHit={() =>
                      send({
                        type: "RESOLVE_SHORTSWORD",
                        hit: true,
                        weaponDamage: shortswordWeaponDamage,
                        sneakAttackDamage: shortswordSneakDamage,
                      })
                    }
                    onMiss={() =>
                      send({
                        type: "RESOLVE_SHORTSWORD",
                        hit: false,
                        weaponDamage: 0,
                        sneakAttackDamage: 0,
                      })
                    }
                  />
                </>
              )}

              {currentPhase === "nickAttack" && (
                <>
                  <AttackHeader
                    note={
                      context.vexAdvantageQueued
                        ? "Vex landed — roll with advantage."
                        : "No Vex advantage, roll normally."
                    }
                    noteActive={context.vexAdvantageQueued}
                    title="Nick Attack: Dagger"
                  />
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    <DieSelector
                      dieSides={4}
                      hint={
                        settings.applyDexToBothWeapons
                          ? "Choose the raw d4 result. Dex is added automatically."
                          : "Choose the raw d4 result for the Nick dagger."
                      }
                      label="Dagger roll"
                      modifier={daggerModifier}
                      onChange={setNickWeaponDie}
                      total={nickWeaponDamage}
                      totalLabel="Weapon damage"
                      value={nickWeaponDie}
                    />
                    <DicePoolSelector
                      dieSides={6}
                      disabled={!context.sneakAttackAvailable}
                      hint={
                        context.sneakAttackAvailable
                          ? "Shortsword missed — Sneak Attack can land here instead."
                          : "Sneak Attack was already spent on the shortsword."
                      }
                      label={`Sneak Attack (${sneakAttackDiceCount}d6)`}
                      onChange={setNickSneakDie}
                      subtotal={nickSneakDamage}
                      values={nickSneakDice}
                    />
                  </div>
                  <HitMissButtons
                    hitDisabled={!isNickHitReady}
                    hitHint={getNickHitHint(
                      nickWeaponDie !== null,
                      context.sneakAttackAvailable,
                      isNickSneakReady,
                    )}
                    onHit={() =>
                      send({
                        type: "RESOLVE_NICK",
                        hit: true,
                        weaponDamage: nickWeaponDamage,
                        sneakAttackDamage: context.sneakAttackAvailable
                          ? nickSneakDamage
                          : 0,
                      })
                    }
                    onMiss={() =>
                      send({
                        type: "RESOLVE_NICK",
                        hit: false,
                        weaponDamage: 0,
                        sneakAttackDamage: 0,
                      })
                    }
                  />
                </>
              )}

              {currentPhase === "bonusActionChoice" && (
                <BonusActionPanel
                  onChoose={(choice) =>
                    send({ type: "CHOOSE_BONUS_ACTION", choice })
                  }
                />
              )}

              {currentPhase === "turnEnded" && (
                <TurnEndPanel
                  bonusAction={context.bonusAction}
                  damageTotal={context.damageTotal}
                  onReset={() => send({ type: "RESET" })}
                  onStartNext={() => send({ type: "START_TURN" })}
                />
              )}
            </div>
          </div>

          <Sidebar
            damageTotal={context.damageTotal}
            daggerModifier={daggerModifier}
            resolvedAttacks={resolvedAttacks}
            settings={settings}
            sneakAttackAvailable={context.sneakAttackAvailable}
            sneakAttackDiceCount={sneakAttackDiceCount}
            vexAdvantageQueued={context.vexAdvantageQueued}
          />
        </div>
      </div>
    </>
  )
}
