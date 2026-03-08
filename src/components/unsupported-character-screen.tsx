import { LogOut, Plus } from "lucide-react"
import { CharacterForm } from "~/components/character-form"
import { CharacterSwitcher } from "~/components/character-switcher"
import { Button } from "~/components/ui/button"
import type {
  CharacterFormValues,
  CharacterRecord,
} from "~/lib/character-record"
import { getCharacterSummary } from "~/lib/character-record"

export function UnsupportedCharacterScreen({
  activeCharacter,
  characters,
  onCreateCharacter,
  onSetActiveCharacter,
  onSignOut,
  onUpdateCharacter,
}: {
  activeCharacter: CharacterRecord
  characters: CharacterRecord[]
  onCreateCharacter: (values: CharacterFormValues) => Promise<void>
  onSetActiveCharacter: (characterId: string) => Promise<void>
  onSignOut: () => Promise<void>
  onUpdateCharacter: (values: CharacterFormValues) => Promise<void>
}) {
  return (
    <div className="min-h-screen bg-warm-950 text-warm-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-warm-800 bg-warm-950 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.3em] text-amber-400">
            Character Library
          </p>
          <h1 className="mt-0.5 text-base font-bold text-warm-50">
            {activeCharacter.name}
          </h1>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <CharacterSwitcher
            activeCharacterId={activeCharacter._id}
            characters={characters}
            onChange={onSetActiveCharacter}
          />
          <span className="rounded-md border border-warm-800 bg-warm-900 px-2 py-1 text-[10px] font-mono text-warm-300">
            {getCharacterSummary(activeCharacter)}
          </span>
        </div>

        <Button
          className="border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800"
          onClick={() => void onSignOut()}
          size="sm"
          type="button"
          variant="outline"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-5">
        <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
            Tracker status
          </p>
          <h2 className="mt-1 text-2xl font-bold text-warm-50">
            Tracker not built yet
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-300">
            {activeCharacter.name} is saved and editable, but{" "}
            {activeCharacter.className.toLowerCase()} turn support has not been
            implemented yet.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
            <CharacterForm
              description="You can keep updating the basics now. If this class gains a tracker later, this character will be ready for it."
              initialValues={{
                name: activeCharacter.name,
                className: activeCharacter.className,
                subclassName: activeCharacter.subclassName ?? "",
                level: activeCharacter.level,
              }}
              key={`unsupported-${activeCharacter._id}`}
              onSubmit={onUpdateCharacter}
              submitLabel="Save character"
              title="Edit character"
            />
          </section>

          <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-amber-400">
              <Plus className="h-4 w-4" />
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em]">
                New character
              </p>
            </div>
            <CharacterForm
              description="Keep adding more characters to the same account. Rogues jump straight into the live tracker."
              initialValues={{
                name: "",
                className: "Rogue",
                subclassName: "",
                level: 1,
              }}
              key="unsupported-create-character"
              onSubmit={onCreateCharacter}
              submitLabel="Create another character"
              title="Expand the roster"
            />
          </section>
        </div>
      </main>
    </div>
  )
}
