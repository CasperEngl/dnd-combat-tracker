import { Check, SlidersHorizontal } from "lucide-react"
import { Fragment } from "react"
import { CharacterSwitcher } from "~/components/character-switcher"
import { Button } from "~/components/ui/button"
import type { CharacterRecord } from "~/lib/character-record"
import { getCharacterSummary } from "~/lib/character-record"
import { formatSignedNumber } from "~/lib/dice"
import type { RogueTrackerSettings } from "~/lib/rogue-tracker"

export type TurnPhase =
  | "idle"
  | "shortswordAttack"
  | "nickAttack"
  | "bonusActionChoice"
  | "turnEnded"

const phaseOrder: TurnPhase[] = [
  "idle",
  "shortswordAttack",
  "nickAttack",
  "bonusActionChoice",
  "turnEnded",
]

const phaseLabels: Record<TurnPhase, string> = {
  idle: "Begin",
  shortswordAttack: "Shortsword",
  nickAttack: "Nick",
  bonusActionChoice: "Cunning",
  turnEnded: "Done",
}

interface HeaderBarProps {
  activeCharacter: CharacterRecord
  characters: CharacterRecord[]
  currentPhase: TurnPhase
  onOpenSettings: () => void
  onReset: () => void
  onSetActiveCharacter: (characterId: string) => void
  settings: RogueTrackerSettings
}

export function HeaderBar({
  activeCharacter,
  characters,
  currentPhase,
  onOpenSettings,
  onReset,
  onSetActiveCharacter,
  settings,
}: HeaderBarProps) {
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase)

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-warm-800 bg-warm-950 px-4 py-3 sm:px-5">
      <div className="flex-none">
        <p className="text-[9px] leading-none font-mono font-semibold uppercase tracking-[0.3em] text-amber-400">
          Rogue Turn Tracker
        </p>
        <h1 className="mt-0.5 text-base leading-none font-bold text-warm-50">
          {activeCharacter.name}
        </h1>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <CharacterSwitcher
          activeCharacterId={activeCharacter._id}
          characters={characters}
          onChange={onSetActiveCharacter}
        />
        <span className="rounded-md border border-warm-800 bg-warm-900 px-2 py-1 text-[10px] font-mono text-warm-300">
          {getCharacterSummary(activeCharacter)}
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center">
            {phaseOrder.map((phase, index) => {
              const isComplete = index < currentPhaseIndex
              const isCurrent = index === currentPhaseIndex

              return (
                <Fragment key={phase}>
                  <div
                    className={[
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                      isComplete
                        ? "bg-amber-600 text-white"
                        : isCurrent
                          ? "bg-amber-500 text-white ring-1 ring-amber-300/50 ring-offset-1 ring-offset-warm-950"
                          : "bg-warm-800 text-warm-300",
                    ].join(" ")}
                  >
                    {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  {index < phaseOrder.length - 1 ? (
                    <div
                      className={[
                        "h-px w-5 sm:w-7",
                        isComplete ? "bg-amber-600" : "bg-warm-800",
                      ].join(" ")}
                    />
                  ) : null}
                </Fragment>
              )
            })}
          </div>
          <span className="text-xs font-mono text-amber-400">
            {phaseLabels[currentPhase]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-warm-300">
          <span className="rounded-md border border-warm-800 bg-warm-900 px-2 py-1">
            Lv {settings.level}
          </span>
          <span className="rounded-md border border-warm-800 bg-warm-900 px-2 py-1">
            Dex {formatSignedNumber(settings.dexModifier)}
          </span>
          <span className="rounded-md border border-warm-800 bg-warm-900 px-2 py-1">
            Nick Dex {settings.applyDexToBothWeapons ? "on" : "off"}
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          className="border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800 hover:text-warm-50"
          onClick={onOpenSettings}
          size="sm"
          type="button"
          variant="outline"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Settings
        </Button>
        <Button
          className="border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800 hover:text-warm-50"
          onClick={onReset}
          size="sm"
          type="button"
          variant="outline"
        >
          Reset
        </Button>
      </div>
    </header>
  )
}
