export function LoadingScreen({
  detail = "Syncing your character tracker.",
}: {
  detail?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-950 px-4 text-warm-100">
      <div className="rounded-2xl border border-warm-700 bg-warm-900 px-5 py-4 text-center">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
          Loading
        </p>
        <p className="mt-2 text-sm text-warm-300">{detail}</p>
      </div>
    </div>
  )
}
