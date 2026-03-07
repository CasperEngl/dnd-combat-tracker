import { ChevronRight, Eye, type LucideIcon, Shield, Wind } from "lucide-react"
import type { BonusActionChoice } from "~/rogueTurnMachine"

const bonusActions: Array<{
  id: BonusActionChoice
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    id: "disengage",
    label: "Disengage",
    description: "Ghost through the fray without drawing another blow.",
    icon: Shield,
  },
  {
    id: "hide",
    label: "Hide",
    description: "Melt into darkness and await your moment.",
    icon: Eye,
  },
  {
    id: "dash",
    label: "Dash",
    description: "Sprint through the chaos — distance is your ally.",
    icon: Wind,
  },
]

export function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-xl border border-warm-700 bg-warm-900 p-4">
      <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
        Ready
      </p>
      <h2 className="mt-1 text-lg font-bold text-warm-50">
        Your blade thirsts.
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-warm-200">
        Shortsword with Vex, then dagger with Nick, then Cunning Action. Dice
        are chosen explicitly so every damage roll is visible before you commit
        the hit.
      </p>
      <button
        className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 active:bg-amber-700"
        onClick={onStart}
        type="button"
      >
        Draw blades
      </button>
    </div>
  )
}

export function BonusActionPanel({
  onChoose,
}: {
  onChoose: (choice: BonusActionChoice) => void
}) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-warm-700 bg-warm-900 px-4 py-3">
        <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
          Cunning Action
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-warm-50">
          How do you slip away?
        </h2>
      </div>
      {bonusActions.map((action) => {
        const Icon = action.icon

        return (
          <button
            className="group flex w-full items-start gap-3 rounded-xl border border-warm-700 bg-warm-900 px-4 py-3 text-left transition hover:border-amber-500 hover:bg-warm-800"
            key={action.id}
            onClick={() => onChoose(action.id)}
            type="button"
          >
            <div className="mt-0.5 rounded-lg border border-warm-700 bg-warm-950 p-2 text-warm-200 transition group-hover:border-amber-500 group-hover:text-amber-300">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-100 transition group-hover:text-amber-300">
                {action.label}
              </p>
              <p className="mt-0.5 text-xs text-warm-300">
                {action.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function TurnEndPanel({
  damageTotal,
  bonusAction,
  onStartNext,
  onReset,
}: {
  damageTotal: number
  bonusAction: BonusActionChoice | null
  onStartNext: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="rounded-xl border border-amber-700/50 bg-amber-900/30 p-5 text-center">
        <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-300">
          Turn complete
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-warm-50">
          {damageTotal}
        </p>
        <p className="mt-1 text-xs text-amber-200/70">
          damage dealt this round
        </p>
        {bonusAction && (
          <p className="mt-1.5 text-xs capitalize text-warm-300">
            <span className="inline-flex items-center gap-1">
              Cunning Action
              <ChevronRight className="h-3 w-3" />
              {bonusAction}
            </span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          className="rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
          onClick={onStartNext}
          type="button"
        >
          Next round
        </button>
        <button
          className="rounded-xl border border-warm-600 bg-warm-900 py-3 text-sm font-semibold text-warm-100 transition hover:border-warm-500 hover:bg-warm-800"
          onClick={onReset}
          type="button"
        >
          Sheathe blades
        </button>
      </div>
    </div>
  )
}
