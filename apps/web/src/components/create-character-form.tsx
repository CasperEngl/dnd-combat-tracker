import { CharacterForm } from "~/components/character-form"
import type { CharacterFormValues } from "~/lib/character-record"

const emptyCharacterValues: CharacterFormValues = {
  name: "",
  className: "",
  subclassName: "",
  level: 1,
}

export function CreateCharacterForm({
  onSubmit,
}: {
  onSubmit: (values: CharacterFormValues) => Promise<void>
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_38%),linear-gradient(180deg,_#2c0f06,_#1d0a04)] px-4 py-10 text-warm-100">
      <div className="w-full max-w-xl rounded-2xl border border-warm-700 bg-warm-900/95 p-6 shadow-2xl shadow-black/30">
        <CharacterForm
          description="Create a character first. Supported classes open straight into their tracker, while the rest stay ready on their sheet until their flow is built."
          initialValues={emptyCharacterValues}
          onSubmit={onSubmit}
          submitLabel="Create character"
          title="Build your roster"
        />
      </div>
    </div>
  )
}
