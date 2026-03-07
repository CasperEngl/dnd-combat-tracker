import { useMachine } from "@xstate/react"
import {
  Check,
  ChevronRight,
  Crosshair,
  Eye,
  Flame,
  type LucideIcon,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Wind,
  X,
} from "lucide-react"
import { Fragment, useEffect, useState } from "react"
import type { AttackResult, BonusActionChoice } from "./rogueTurnMachine"
import { rogueTurnMachine } from "./rogueTurnMachine"

type TurnPhase =
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

const createRange = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const shortswordDamageOptions = createRange(4, 9)
const daggerDamageOptions = createRange(1, 4)
const sneakAttackOptions = createRange(0, 24)

export default function App() {
  const [snapshot, send] = useMachine(rogueTurnMachine)
  const [shortswordDamage, setShortswordDamage] = useState<number | null>(null)
  const [shortswordSneakDamage, setShortswordSneakDamage] = useState<
    number | null
  >(null)
  const [nickDamage, setNickDamage] = useState<number | null>(null)
  const [nickSneakDamage, setNickSneakDamage] = useState<number | null>(null)

  const currentPhase = snapshot.value as TurnPhase
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase)
  const { context } = snapshot
  const isShortswordHitReady =
    shortswordDamage !== null && shortswordSneakDamage !== null
  const isNickHitReady =
    nickDamage !== null &&
    (!context.sneakAttackAvailable || nickSneakDamage !== null)

  useEffect(() => {
    if (!phaseOrder.includes(currentPhase)) {
      return
    }

    setShortswordDamage(null)
    setShortswordSneakDamage(null)
    setNickDamage(null)
    setNickSneakDamage(null)
  }, [currentPhase])

  const resolvedAttacks = [context.shortsword, context.nick].filter(
    (a) => a.hit !== null,
  )

  return (
    <div className="h-screen overflow-hidden bg-warm-950 text-warm-100 flex flex-col">
      {/* Top bar */}
      <header className="flex-none flex items-center gap-5 border-b border-warm-800 bg-warm-950 px-5 py-2.5">
        <div className="flex-none">
          <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.3em] text-amber-400 leading-none">
            Rogue Turn Tracker
          </p>
          <h1 className="mt-0.5 text-base font-bold leading-none text-warm-50">
            Roll Flow
          </h1>
        </div>

        {/* Phase stepper */}
        <div className="flex flex-1 items-center gap-3">
          <div className="flex items-center">
            {phaseOrder.map((phase, i) => {
              const isComplete = i < currentPhaseIndex
              const isCurrent = i === currentPhaseIndex
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
                    {isComplete ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  {i < phaseOrder.length - 1 && (
                    <div
                      className={[
                        "h-px w-7",
                        isComplete ? "bg-amber-600" : "bg-warm-800",
                      ].join(" ")}
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          <span className="text-xs font-mono text-amber-400">
            {phaseLabels[currentPhase]}
          </span>
        </div>

        <button
          className="flex-none rounded-md border border-warm-700 px-3 py-1 text-xs font-medium text-warm-200 transition hover:border-warm-500 hover:text-warm-50"
          onClick={() => send({ type: "RESET" })}
          type="button"
        >
          Reset
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_240px] gap-3 p-3">
        {/* Left main action */}
        <div className="min-h-0 flex flex-col gap-2.5 overflow-y-auto">
          {currentPhase === "idle" && (
            <IntroPanel onStart={() => send({ type: "START_TURN" })} />
          )}

          {currentPhase === "shortswordAttack" && (
            <>
              <AttackHeader
                title="Action: Shortsword (Vex)"
                note="On hit, Sneak Attack lands here and Vex grants advantage on Nick."
                noteActive
              />
              <div className="grid grid-cols-2 gap-2.5">
                <DamageSelector
                  label="Shortsword damage"
                  hint="1d6 + 3"
                  options={shortswordDamageOptions}
                  value={shortswordDamage}
                  onChange={setShortswordDamage}
                  columns={6}
                />
                <DamageSelector
                  label="Sneak Attack"
                  hint="Always available on shortsword hit."
                  options={sneakAttackOptions}
                  value={shortswordSneakDamage}
                  onChange={setShortswordSneakDamage}
                  columns={8}
                />
              </div>
              <HitMissButtons
                hitDisabled={!isShortswordHitReady}
                hitHint={
                  isShortswordHitReady
                    ? null
                    : "Choose shortsword and Sneak Attack damage before confirming a hit."
                }
                onHit={() =>
                  send({
                    type: "RESOLVE_SHORTSWORD",
                    hit: true,
                    weaponDamage: shortswordDamage ?? 0,
                    sneakAttackDamage: shortswordSneakDamage ?? 0,
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
                title="Nick Attack: Dagger"
                note={
                  context.vexAdvantageQueued
                    ? "Vex landed — roll with advantage."
                    : "No Vex advantage, roll normally."
                }
                noteActive={context.vexAdvantageQueued}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <DamageSelector
                  label="Dagger damage"
                  hint="1d4"
                  options={daggerDamageOptions}
                  value={nickDamage}
                  onChange={setNickDamage}
                  columns={4}
                />
                <DamageSelector
                  disabled={!context.sneakAttackAvailable}
                  label="Sneak Attack"
                  hint={
                    context.sneakAttackAvailable
                      ? "Shortsword missed — still yours to spend."
                      : "Already spent on the shortsword."
                  }
                  options={sneakAttackOptions}
                  value={context.sneakAttackAvailable ? nickSneakDamage : null}
                  onChange={setNickSneakDamage}
                  columns={8}
                />
              </div>
              <HitMissButtons
                hitDisabled={!isNickHitReady}
                hitHint={
                  isNickHitReady
                    ? null
                    : context.sneakAttackAvailable
                      ? "Choose dagger and Sneak Attack damage before confirming a hit."
                      : "Choose dagger damage before confirming a hit."
                }
                onHit={() =>
                  send({
                    type: "RESOLVE_NICK",
                    hit: true,
                    weaponDamage: nickDamage ?? 0,
                    sneakAttackDamage: nickSneakDamage ?? 0,
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
              damageTotal={context.damageTotal}
              bonusAction={context.bonusAction}
              onStartNext={() => send({ type: "START_TURN" })}
              onReset={() => send({ type: "RESET" })}
            />
          )}
        </div>

        {/* Right sidebar */}
        <div className="min-h-0 flex flex-col gap-2.5 overflow-y-auto">
          {/* Status */}
          <div className="rounded-xl border border-warm-700 bg-warm-900 p-3">
            <p className="mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-warm-300">
              Status
            </p>
            <div className="space-y-1.5">
              <StatusRow
                label="Sneak Attack"
                value={context.sneakAttackAvailable ? "Available" : "Spent"}
                color={context.sneakAttackAvailable ? "green" : "red"}
                icon={Sparkles}
              />
              <StatusRow
                label="Vex Advantage"
                value={context.vexAdvantageQueued ? "Queued" : "None"}
                color={context.vexAdvantageQueued ? "amber" : "neutral"}
                icon={Crosshair}
              />
              <StatusRow
                label="Total Damage"
                value={`${context.damageTotal}`}
                color="orange"
                icon={Flame}
              />
            </div>
          </div>

          {/* Turn log */}
          <div className="rounded-xl border border-warm-700 bg-warm-900 p-3">
            <p className="mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-warm-300">
              Turn log
            </p>
            {resolvedAttacks.length > 0 ? (
              <div className="space-y-1.5">
                {resolvedAttacks.map((attack) => (
                  <AttackLogEntry attack={attack} key={attack.id} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-warm-400">No strikes yet.</p>
            )}
          </div>

          {/* Reference */}
          <div className="rounded-xl border border-warm-700 bg-warm-900 p-3">
            <p className="mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-warm-300">
              Reference
            </p>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <ReferenceRow
                icon={Crosshair}
                label="Vex"
                text="On a shortsword hit, grants advantage on the Nick attack."
              />
              <ReferenceRow
                icon={Sparkles}
                label="Sneak Attack"
                text="Once per turn — if shortsword misses, the dagger claims it."
              />
              <ReferenceRow
                icon={Swords}
                label="Nick"
                text="A free extra attack — no bonus action cost."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-components

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-xl border border-warm-700 bg-warm-900 p-4">
      <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
        Ready
      </p>
      <h2 className="mt-1 text-lg font-bold text-warm-50">
        Your blade thirsts.
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-warm-200">
        Shortsword with Vex, then dagger with Nick, then Cunning Action. The
        shadows are with you — the state machine will guide every step.
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

function AttackHeader({
  title,
  note,
  noteActive,
}: {
  title: string
  note: string
  noteActive: boolean
}) {
  return (
    <div className="rounded-xl border border-warm-700 bg-warm-900 px-4 py-3">
      <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
        Attack
      </p>
      <h2 className="mt-0.5 text-lg font-bold leading-tight text-warm-50">
        {title}
      </h2>
      <div
        className={[
          "mt-2 rounded-lg border px-2.5 py-2 text-xs leading-relaxed",
          noteActive
            ? "border-amber-600/50 bg-amber-900/40 text-amber-100"
            : "border-warm-700 bg-warm-800/60 text-warm-200",
        ].join(" ")}
      >
        {note}
      </div>
    </div>
  )
}

function DamageSelector({
  label,
  hint,
  options,
  value,
  onChange,
  disabled = false,
  columns = 6,
}: {
  label: string
  hint: string
  options: number[]
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  columns?: 4 | 6 | 8
}) {
  const displayValue = value ?? 0
  const displayLabel = value === null ? "?" : `${value}`
  const colsClass = { 4: "grid-cols-4", 6: "grid-cols-6", 8: "grid-cols-8" }[
    columns
  ]

  return (
    <div
      className={[
        "rounded-xl border p-2.5 transition-opacity",
        disabled
          ? "border-warm-800 bg-warm-900/50 opacity-40 pointer-events-none"
          : "border-warm-700 bg-warm-900",
      ].join(" ")}
    >
      {/* Label + inline stepper */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-warm-200 leading-none">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex h-5 w-5 items-center justify-center rounded bg-warm-800 text-xs font-bold text-warm-100 transition hover:bg-warm-700 disabled:opacity-40"
            disabled={disabled || value === null || displayValue <= 0}
            onClick={() => onChange(Math.max(0, displayValue - 1))}
            type="button"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-7 text-center font-mono text-sm font-bold text-warm-50 tabular-nums">
            {displayLabel}
          </span>
          <button
            className="flex h-5 w-5 items-center justify-center rounded bg-warm-800 text-xs font-bold text-warm-100 transition hover:bg-warm-700 disabled:opacity-40"
            disabled={disabled}
            onClick={() =>
              onChange(value === null ? options[0] : displayValue + 1)
            }
            type="button"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Quick-pick grid */}
      <div className={`grid ${colsClass} gap-1`}>
        {options.map((option) => (
          <button
            className={[
              "rounded py-1.5 font-mono text-xs font-semibold transition",
              option === displayValue
                ? "bg-amber-600 text-white"
                : "bg-warm-800 text-warm-100 hover:bg-warm-700",
            ].join(" ")}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      <p className="mt-1.5 text-[10px] text-warm-300">{hint}</p>
    </div>
  )
}

function HitMissButtons({
  onHit,
  onMiss,
  hitDisabled = false,
  hitHint = null,
}: {
  onHit: () => void
  onMiss: () => void
  hitDisabled?: boolean
  hitHint?: string | null
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          className="rounded-xl bg-amber-600 py-3 text-sm font-bold text-white transition hover:bg-amber-500 active:bg-amber-700 disabled:cursor-not-allowed disabled:bg-warm-700 disabled:text-warm-300"
          disabled={hitDisabled}
          onClick={onHit}
          type="button"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Check className="h-4 w-4" />
            Hit
          </span>
        </button>
        <button
          className="rounded-xl border border-warm-600 bg-warm-900 py-3 text-sm font-semibold text-warm-100 transition hover:border-warm-500 hover:bg-warm-800"
          onClick={onMiss}
          type="button"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <X className="h-4 w-4" />
            Miss
          </span>
        </button>
      </div>
      {hitHint && <p className="text-xs text-amber-300/80">{hitHint}</p>}
    </div>
  )
}

function BonusActionPanel({
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

function TurnEndPanel({
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

function StatusRow({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  color: "green" | "red" | "amber" | "neutral" | "orange"
  icon: LucideIcon
}) {
  const colorClass = {
    green: "text-emerald-300",
    red: "text-red-300",
    amber: "text-amber-300",
    neutral: "text-warm-300",
    orange: "text-orange-300",
  }[color]

  const dotClass = {
    green: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    neutral: "bg-warm-500",
    orange: "bg-orange-400",
  }[color]

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-warm-700 bg-warm-950/80 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
        <Icon className="h-3 w-3 text-warm-300" />
        <span className="text-[10px] font-mono text-warm-200">{label}</span>
      </div>
      <span
        className={`text-xs font-semibold font-mono tabular-nums ${colorClass}`}
      >
        {value}
      </span>
    </div>
  )
}

function ReferenceRow({
  icon: Icon,
  label,
  text,
}: {
  icon: LucideIcon
  label: string
  text: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warm-700 bg-warm-950/60 px-2.5 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
      <p>
        <span className="font-semibold text-warm-100">{label}</span>{" "}
        <span className="text-warm-200">{text}</span>
      </p>
    </div>
  )
}

function AttackLogEntry({ attack }: { attack: AttackResult }) {
  return (
    <div className="rounded-lg border border-warm-700 bg-warm-950/60 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-warm-100">{attack.label}</p>
        <span
          className={[
            "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
            attack.hit
              ? "bg-emerald-900/60 text-emerald-300"
              : "bg-red-900/60 text-red-300",
          ].join(" ")}
        >
          {attack.hit ? "HIT" : "MISS"}
        </span>
      </div>
      {attack.hit && (
        <div className="mt-1 flex gap-3 text-[10px] text-warm-300">
          <span>
            Wpn{" "}
            <span className="font-mono font-semibold text-warm-100">
              {attack.weaponDamage}
            </span>
          </span>
          <span>
            Snk{" "}
            <span className="font-mono font-semibold text-warm-100">
              {attack.sneakAttackDamage}
            </span>
          </span>
          <span>
            Tot{" "}
            <span className="font-mono font-semibold text-amber-300">
              {attack.totalDamage}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
