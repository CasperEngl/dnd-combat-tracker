import { useForm } from "@tanstack/react-form"
import { ArrowLeft, LogOut, Plus } from "lucide-react"
import { Link } from "react-router"
import { CharacterForm } from "~/components/character-form"
import { CharacterSwitcher } from "~/components/character-switcher"
import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { hookApi } from "~/generated/convex-hook-api"

import type {
  CharacterFormValues,
  CharacterId,
  CharacterRecord,
  RogueSettingsRecord,
} from "~/lib/character-record"
import { getCharacterSummary } from "~/lib/character-record"
import { getCharacterPath, isTrackerSupported } from "~/lib/character-routing"
import { clampDexModifier, getSneakAttackDiceCount } from "~/lib/rogue-tracker"

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function RogueTrackerSettingsSection({
  activeCharacter,
  rogueSettings,
}: {
  activeCharacter: CharacterRecord
  rogueSettings: RogueSettingsRecord | null
}) {
  const persistSettings =
    hookApi.mutations.characterSettings.useUpsertRogueSettings()
  const form = useForm({
    defaultValues: {
      dexModifier: clampDexModifier(rogueSettings?.dexModifier ?? 0),
      applyDexToBothWeapons: rogueSettings?.applyDexToBothWeapons ?? false,
    },
    onSubmit: async ({ value }) => {
      await persistSettings({
        characterId: activeCharacter._id,
        dexModifier: clampDexModifier(value.dexModifier),
        applyDexToBothWeapons: value.applyDexToBothWeapons,
      })
    },
  })
  const sneakAttackDiceCount = getSneakAttackDiceCount(activeCharacter.level)

  return (
    <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
            Tracker tuning
          </p>
          <h2 className="mt-1 text-lg font-semibold text-warm-50">
            Rogue damage setup
          </h2>
          <p className="mt-1 text-sm text-warm-300">
            Keep the combat tracker honest to the table. Level still comes from
            the character sheet above.
          </p>
        </div>
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/30 px-2 py-1 text-right">
          <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-amber-300">
            Sneak Attack
          </p>
          <p className="text-sm font-semibold text-amber-100">
            {sneakAttackDiceCount}d6
          </p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="dexModifier">
          {(field) => (
            <div>
              <Label
                className="mb-2 block text-xs font-semibold text-warm-200"
                htmlFor={field.name}
              >
                Dex modifier
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                  onClick={() =>
                    field.handleChange(clampDexModifier(field.state.value - 1))
                  }
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  -
                </Button>
                <Input
                  className="border-warm-700 bg-warm-950 text-center font-mono text-warm-50"
                  id={field.name}
                  inputMode="numeric"
                  max={10}
                  min={-5}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      clampDexModifier(
                        parseNumberInput(event.target.value, field.state.value),
                      ),
                    )
                  }
                  type="number"
                  value={field.state.value}
                />
                <Button
                  className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                  onClick={() =>
                    field.handleChange(clampDexModifier(field.state.value + 1))
                  }
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  +
                </Button>
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="applyDexToBothWeapons">
          {(field) => (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-warm-700 bg-warm-950/70 px-3 py-3">
              <div className="space-y-1">
                <Label
                  className="text-xs font-semibold text-warm-100"
                  htmlFor={field.name}
                >
                  Apply Dex to both weapons
                </Label>
                <p className="text-xs leading-relaxed text-warm-300">
                  Turn this on if the Nick dagger should add Dex to damage too.
                </p>
              </div>
              <Switch
                checked={field.state.value}
                className="data-checked:bg-amber-600 data-unchecked:bg-warm-800"
                id={field.name}
                onCheckedChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              className="w-full bg-amber-600 text-white hover:bg-amber-500"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              Save tracker settings
            </Button>
          )}
        </form.Subscribe>
      </form>
    </section>
  )
}

export function CharacterSheetScreen({
  activeCharacter,
  characters,
  onCreateCharacter,
  onSetActiveCharacter,
  onUpdateCharacter,
  rogueSettings,
}: {
  activeCharacter: CharacterRecord
  characters: CharacterRecord[]
  onCreateCharacter: (values: CharacterFormValues) => Promise<void>
  onSetActiveCharacter: (characterId: CharacterId) => void
  onUpdateCharacter: (values: CharacterFormValues) => Promise<void>
  rogueSettings: RogueSettingsRecord | null
}) {
  const { signOut } = hookApi.auth.useActions()
  const trackerSupported = isTrackerSupported(activeCharacter)

  return (
    <div className="min-h-screen bg-warm-950 text-warm-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-warm-800 bg-warm-950 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.3em] text-amber-400">
            Character Sheet
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

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {trackerSupported ? (
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800",
              })}
              to={getCharacterPath(activeCharacter._id)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tracker
            </Link>
          ) : null}
          <Button
            className="border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800"
            onClick={() => void signOut()}
            size="sm"
            type="button"
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-5">
        {!trackerSupported ? (
          <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
              Tracker status
            </p>
            <h2 className="mt-1 text-2xl font-bold text-warm-50">
              Turn tracker not built yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-300">
              {activeCharacter.name} is ready to travel with you, but this class
              still needs its own turn tracker. You can keep the character sheet
              up to date here.
            </p>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-warm-700 bg-warm-900 p-5">
            <CharacterForm
              description="Keep your character sheet current so the tracker matches the table when combat starts."
              initialValues={{
                name: activeCharacter.name,
                className: activeCharacter.className,
                subclassName: activeCharacter.subclassName ?? "",
                level: activeCharacter.level,
              }}
              key={`sheet-${activeCharacter._id}`}
              onSubmit={onUpdateCharacter}
              submitLabel="Save character"
              title="Character details"
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
              description="Add another character to your tracker library. Supported classes open their live tracker right away."
              initialValues={{
                name: "",
                className: "",
                subclassName: "",
                level: 1,
              }}
              key="sheet-create-character"
              onSubmit={onCreateCharacter}
              submitLabel="Create character"
              title="Add another character"
            />
          </section>
        </div>

        {trackerSupported ? (
          <RogueTrackerSettingsSection
            activeCharacter={activeCharacter}
            rogueSettings={rogueSettings}
          />
        ) : null}
      </main>
    </div>
  )
}
