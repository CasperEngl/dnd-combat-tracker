import { Check, X } from "lucide-react"
import { createRange, type DieValue, formatModifier } from "~/lib/dice"

export function AttackHeader({
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
      <h2 className="mt-0.5 text-lg leading-tight font-bold text-warm-50">
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

export function DieSelector({
  label,
  hint,
  dieSides,
  value,
  onChange,
  disabled = false,
  modifier = 0,
  total,
  totalLabel,
}: {
  label: string
  hint: string
  dieSides: 4 | 6
  value: DieValue
  onChange: (value: number) => void
  disabled?: boolean
  modifier?: number
  total: number
  totalLabel: string
}) {
  const displayLabel = value === null ? "?" : `${value}`
  const dieOptions = createRange(1, dieSides)

  return (
    <div
      className={[
        "rounded-xl border p-2.5 transition-opacity",
        disabled
          ? "pointer-events-none border-warm-800 bg-warm-900/50 opacity-40"
          : "border-warm-700 bg-warm-900",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <span className="text-[9px] leading-none font-mono font-semibold uppercase tracking-[0.2em] text-warm-200">
            {label}
          </span>
          <p className="mt-1 text-[11px] text-warm-300">{hint}</p>
        </div>
        <div className="rounded-lg border border-warm-700 bg-warm-950/70 px-2 py-1 text-right">
          <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-warm-300">
            d{dieSides}
          </p>
          <p className="font-mono text-sm font-bold text-warm-50">
            {displayLabel}
          </p>
        </div>
      </div>

      <div
        className={`grid gap-1 ${dieSides === 4 ? "grid-cols-4" : "grid-cols-6"}`}
      >
        {dieOptions.map((option) => (
          <button
            className={[
              "rounded py-1.5 font-mono text-xs font-semibold transition",
              option === value
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

      <div className="mt-2 rounded-lg border border-warm-700 bg-warm-950/60 px-2.5 py-2 text-xs text-warm-300">
        <div className="flex items-center justify-between gap-3">
          <span>Formula</span>
          <span className="font-mono text-warm-100">
            1d{dieSides}
            {formatModifier(modifier)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span>{totalLabel}</span>
          <span className="font-mono font-semibold text-amber-300">
            {value === null ? "?" : total}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DicePoolSelector({
  label,
  hint,
  dieSides,
  values,
  onChange,
  subtotal,
  disabled = false,
}: {
  label: string
  hint: string
  dieSides: 6
  values: DieValue[]
  onChange: (index: number, value: number) => void
  subtotal: number
  disabled?: boolean
}) {
  const slotIds = Array.from(
    { length: values.length },
    (_, slotIndex) => `${label}-${slotIndex + 1}`,
  )

  return (
    <div
      className={[
        "rounded-xl border p-2.5 transition-opacity",
        disabled
          ? "pointer-events-none border-warm-800 bg-warm-900/50 opacity-40"
          : "border-warm-700 bg-warm-900",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <span className="text-[9px] leading-none font-mono font-semibold uppercase tracking-[0.2em] text-warm-200">
            {label}
          </span>
          <p className="mt-1 text-[11px] text-warm-300">{hint}</p>
        </div>
        <div className="rounded-lg border border-warm-700 bg-warm-950/70 px-2 py-1 text-right">
          <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-warm-300">
            Subtotal
          </p>
          <p className="font-mono text-sm font-bold text-amber-300">
            {values.every((value) => value !== null) ? subtotal : "?"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {slotIds.map((slotId, slotIndex) => {
          const value = values[slotIndex]

          return (
            <div
              className="rounded-lg border border-warm-700 bg-warm-950/60 px-2.5 py-2"
              key={slotId}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-semibold text-warm-200">
                  Die {slotIndex + 1}
                </span>
                <span className="font-mono text-xs font-semibold text-warm-50">
                  {value ?? "?"}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {createRange(1, dieSides).map((option) => (
                  <button
                    className={[
                      "rounded py-1.5 font-mono text-xs font-semibold transition",
                      option === value
                        ? "bg-amber-600 text-white"
                        : "bg-warm-800 text-warm-100 hover:bg-warm-700",
                    ].join(" ")}
                    key={option}
                    onClick={() => onChange(slotIndex, option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function HitMissButtons({
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
