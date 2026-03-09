import {
  Crosshair,
  Flame,
  type LucideIcon,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react"
import type { CharacterRecord } from "~/lib/character-record"
import { getCharacterSummary } from "~/lib/character-record"
import { formatSignedNumber, formatWeaponFormula } from "~/lib/dice"
import type { RogueTrackerSettings } from "~/lib/rogue-tracker"
import type { AttackResult } from "~/rogue-turn-machine"

interface SidebarProps {
  activeCharacter: CharacterRecord
  resolvedAttacks: AttackResult[]
  settings: RogueTrackerSettings
  damageTotal: number
  sneakAttackAvailable: boolean
  vexAdvantageQueued: boolean
  daggerModifier: number
  sneakAttackDiceCount: number
}

export function Sidebar({
  activeCharacter,
  resolvedAttacks,
  settings,
  damageTotal,
  sneakAttackAvailable,
  vexAdvantageQueued,
  daggerModifier,
  sneakAttackDiceCount,
}: SidebarProps) {
  return (
    <div className="min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-xl border border-warm-700 bg-warm-900 p-3">
          <p className="mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-warm-300">
            Status
          </p>
          <div className="space-y-1.5">
            <StatusRow
              color={sneakAttackAvailable ? "green" : "red"}
              icon={Sparkles}
              label="Sneak Attack"
              value={sneakAttackAvailable ? "Available" : "Spent"}
            />
            <StatusRow
              color={vexAdvantageQueued ? "amber" : "neutral"}
              icon={Crosshair}
              label="Vex Advantage"
              value={vexAdvantageQueued ? "Queued" : "None"}
            />
            <StatusRow
              color="orange"
              icon={Flame}
              label="Total Damage"
              value={`${damageTotal}`}
            />
            <StatusRow
              color="neutral"
              icon={Shield}
              label="Level"
              value={`${settings.level}`}
            />
            <StatusRow
              color="neutral"
              icon={Swords}
              label="Dex Mod"
              value={formatSignedNumber(settings.dexModifier)}
            />
          </div>
        </div>

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

        <div className="rounded-xl border border-warm-700 bg-warm-900 p-3">
          <p className="mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-warm-300">
            Character
          </p>
          <p className="mb-2 text-sm font-semibold text-warm-50">
            {activeCharacter.name}
          </p>
          <p className="mb-3 text-[11px] text-warm-300">
            {getCharacterSummary(activeCharacter)}
          </p>
          <div className="space-y-1.5 text-[11px] leading-relaxed">
            <ReferenceRow
              icon={Swords}
              label="Shortsword"
              text={formatWeaponFormula(6, settings.dexModifier)}
            />
            <ReferenceRow
              icon={Swords}
              label="Nick dagger"
              text={formatWeaponFormula(4, daggerModifier)}
            />
            <ReferenceRow
              icon={Sparkles}
              label="Sneak Attack"
              text={`${sneakAttackDiceCount}d6 at rogue level ${settings.level}.`}
            />
          </div>
        </div>

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
        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <Icon className="h-3 w-3 text-warm-300" />
        <span className="text-[10px] font-mono text-warm-200">{label}</span>
      </div>
      <span
        className={`text-xs font-mono font-semibold tabular-nums ${colorClass}`}
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
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
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
