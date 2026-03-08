import { useMachine } from "@xstate/react"
import { useEffect, useState } from "react"
import { SettingsPane } from "~/components/settings-pane"
import {
  AttackHeader,
  DicePoolSelector,
  DieSelector,
  HitMissButtons,
} from "~/components/tracker/attack-controls"
import {
  BonusActionPanel,
  IntroPanel,
  TurnEndPanel,
} from "~/components/tracker/flow-panels"
import { HeaderBar, type TurnPhase } from "~/components/tracker/header-bar"
import { Sidebar } from "~/components/tracker/sidebar"
import { useDamageEntry } from "~/context/damage-entry-context"
import { useRogueTracker } from "~/context/rogue-tracker-context"
import type {
  CharacterFormValues,
  CharacterRecord,
} from "~/lib/character-record"
import { allDiceSelected, isDicePoolCommitted } from "~/lib/dice"
import { rogueTurnMachine } from "~/rogue-turn-machine"

const getShortswordHitHint = (
  weaponDieSelected: boolean,
  sneakAttackCommitted: boolean,
) => {
  if (!weaponDieSelected && !sneakAttackCommitted) {
    return "Choose the shortsword die, then either finish every Sneak Attack die or leave Sneak Attack off."
  }

  if (!weaponDieSelected) {
    return "Choose the shortsword die before confirming a hit."
  }

  if (!sneakAttackCommitted) {
    return "Either finish every Sneak Attack die or leave Sneak Attack off before confirming a hit."
  }

  return null
}

const getNickHitHint = (
  weaponDieSelected: boolean,
  sneakAttackAvailable: boolean,
  sneakAttackCommitted: boolean,
) => {
  if (!weaponDieSelected && sneakAttackAvailable && !sneakAttackCommitted) {
    return "Choose the dagger die, then either finish every Sneak Attack die or leave Sneak Attack off."
  }

  if (!weaponDieSelected) {
    return "Choose the dagger die before confirming a hit."
  }

  if (sneakAttackAvailable && !sneakAttackCommitted) {
    return "Either finish every Sneak Attack die or leave Sneak Attack off before confirming a hit."
  }

  return null
}

interface TrackerScreenProps {
  activeCharacter: CharacterRecord
  characters: CharacterRecord[]
  onCreateCharacter: (values: CharacterFormValues) => Promise<void>
  onSetActiveCharacter: (characterId: string) => Promise<void>
  onSignOut: () => Promise<void>
  onUpdateCharacter: (values: CharacterFormValues) => Promise<void>
}

export function TrackerScreen({
  activeCharacter,
  characters,
  onCreateCharacter,
  onSetActiveCharacter,
  onSignOut,
  onUpdateCharacter,
}: TrackerScreenProps) {
  const [snapshot, send] = useMachine(rogueTurnMachine)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, saveSettings, sneakAttackDiceCount, daggerModifier } =
    useRogueTracker()
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
    resetSelections,
  } = useDamageEntry()

  const currentPhase = snapshot.value as TurnPhase
  const { context } = snapshot
  const selectionResetToken = `${currentPhase}:${settings.level}:${settings.dexModifier}:${settings.applyDexToBothWeapons}`

  useEffect(() => {
    void selectionResetToken
    resetSelections()
  }, [resetSelections, selectionResetToken])

  const resolvedAttacks = [context.shortsword, context.nick].filter(
    (attack) => attack.hit !== null,
  )
  const isNickHitReady =
    nickWeaponDie !== null &&
    (!context.sneakAttackAvailable || isDicePoolCommitted(nickSneakDice))

  return (
    <>
      <SettingsPane
        activeCharacter={activeCharacter}
        onCreateCharacter={onCreateCharacter}
        onOpenChange={setSettingsOpen}
        onSaveSettings={saveSettings}
        onSignOut={onSignOut}
        onUpdateCharacter={onUpdateCharacter}
        open={settingsOpen}
        settings={settings}
      />

      <div className="flex min-h-screen flex-col overflow-hidden bg-warm-950 text-warm-100">
        <HeaderBar
          activeCharacter={activeCharacter}
          characters={characters}
          currentPhase={currentPhase}
          onOpenSettings={() => setSettingsOpen(true)}
          onReset={() => send({ type: "RESET" })}
          onSetActiveCharacter={(characterId) =>
            void onSetActiveCharacter(characterId)
          }
          settings={settings}
        />

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[1fr_240px]">
          <div className="min-h-0 overflow-y-auto">
            <div className="flex min-h-full flex-col gap-2.5">
              {currentPhase === "idle" ? (
                <IntroPanel onStart={() => send({ type: "START_TURN" })} />
              ) : null}

              {currentPhase === "shortswordAttack" ? (
                <>
                  <AttackHeader
                    note="On hit, shortsword damage always lands. Sneak Attack is optional here, and Vex still grants advantage on Nick."
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
                      isDicePoolCommitted(shortswordSneakDice),
                    )}
                    onHit={() =>
                      send({
                        type: "RESOLVE_SHORTSWORD",
                        hit: true,
                        weaponDamage: shortswordWeaponDamage,
                        sneakAttackDamage: allDiceSelected(shortswordSneakDice)
                          ? shortswordSneakDamage
                          : 0,
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
              ) : null}

              {currentPhase === "nickAttack" ? (
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
                      isDicePoolCommitted(nickSneakDice),
                    )}
                    onHit={() =>
                      send({
                        type: "RESOLVE_NICK",
                        hit: true,
                        weaponDamage: nickWeaponDamage,
                        sneakAttackDamage: context.sneakAttackAvailable
                          ? allDiceSelected(nickSneakDice)
                            ? nickSneakDamage
                            : 0
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
              ) : null}

              {currentPhase === "bonusActionChoice" ? (
                <BonusActionPanel
                  onChoose={(choice) =>
                    send({ type: "CHOOSE_BONUS_ACTION", choice })
                  }
                />
              ) : null}

              {currentPhase === "turnEnded" ? (
                <TurnEndPanel
                  bonusAction={context.bonusAction}
                  damageTotal={context.damageTotal}
                  onReset={() => send({ type: "RESET" })}
                  onStartNext={() => send({ type: "START_TURN" })}
                />
              ) : null}
            </div>
          </div>

          <Sidebar
            activeCharacter={activeCharacter}
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
