import { useForm } from "@tanstack/react-form"
import { LogOut, Plus, Settings2 } from "lucide-react"
import { useState } from "react"
import { CharacterForm } from "~/components/character-form"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { Switch } from "~/components/ui/switch"
import type {
  CharacterFormValues,
  CharacterRecord,
} from "~/lib/character-record"
import {
  clampDexModifier,
  getSneakAttackDiceCount,
  type RogueTrackerSettings,
} from "~/lib/rogue-tracker"

interface SettingsPaneProps {
  activeCharacter: CharacterRecord
  open: boolean
  onCreateCharacter: (values: CharacterFormValues) => Promise<void>
  onOpenChange: (open: boolean) => void
  onSaveSettings: (settings: RogueTrackerSettings) => Promise<void>
  onSignOut: () => Promise<void>
  onUpdateCharacter: (values: CharacterFormValues) => Promise<void>
  settings: RogueTrackerSettings
}

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function RogueTrackerSettingsForm({
  onSubmit,
  settings,
}: {
  onSubmit: (settings: RogueTrackerSettings) => Promise<void>
  settings: RogueTrackerSettings
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const sneakAttackDiceCount = getSneakAttackDiceCount(settings.level)
  const form = useForm({
    defaultValues: {
      dexModifier: settings.dexModifier,
      applyDexToBothWeapons: settings.applyDexToBothWeapons,
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      setSavedMessage(null)
      await onSubmit({
        ...settings,
        dexModifier: clampDexModifier(value.dexModifier),
        applyDexToBothWeapons: value.applyDexToBothWeapons,
      })
      setSavedMessage("Rogue tracker settings saved.")
    },
  })

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
            Rogue tracker
          </p>
          <h3 className="mt-1 text-sm font-semibold text-warm-50">
            Sneak Attack and weapon tuning
          </h3>
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

      <p className="text-xs leading-relaxed text-warm-300">
        Rogue level comes from the active character sheet. Save tracker changes
        when you are ready.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit().catch((error: unknown) => {
            setSavedMessage(null)
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to save settings.",
            )
          })
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
                  className="border-warm-700 bg-warm-900 text-center font-mono text-warm-50"
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
                  Turn this on if the Nick dagger should add the active
                  character's Dex modifier to damage too.
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

        {errorMessage ? (
          <div className="rounded-lg border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {savedMessage ? (
          <div className="rounded-lg border border-emerald-900/70 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">
            {savedMessage}
          </div>
        ) : null}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              className="w-full bg-amber-600 text-white hover:bg-amber-500"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              Save
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}

export function SettingsPane({
  activeCharacter,
  open,
  onCreateCharacter,
  onOpenChange,
  onSaveSettings,
  onSignOut,
  onUpdateCharacter,
  settings,
}: SettingsPaneProps) {
  const [showCreateCharacter, setShowCreateCharacter] = useState(false)

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto border-warm-700 bg-warm-950 p-0 text-warm-100 sm:max-w-md"
        side="right"
      >
        <SheetHeader className="border-b border-warm-800 px-5 py-4 text-left">
          <div className="flex items-center gap-2 text-amber-400">
            <Settings2 className="h-4 w-4" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em]">
              Settings
            </span>
          </div>
          <SheetTitle className="text-xl font-bold text-warm-50">
            {activeCharacter.name}
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-warm-300">
            Edit the active character, tune rogue damage settings, or create
            another character on this account.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-5 py-4">
          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <CharacterForm
              description="Basic character details stay editable even if you switch this character away from the rogue tracker later."
              initialValues={{
                name: activeCharacter.name,
                className: activeCharacter.className,
                subclassName: activeCharacter.subclassName ?? "",
                level: activeCharacter.level,
              }}
              key={`edit-${activeCharacter._id}`}
              onSubmit={onUpdateCharacter}
              submitLabel="Save character"
              title="Active character"
            />
          </section>

          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <RogueTrackerSettingsForm
              key={`rogue-${activeCharacter._id}:${settings.dexModifier}:${settings.applyDexToBothWeapons}`}
              onSubmit={onSaveSettings}
              settings={settings}
            />
          </section>

          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Roster
                </p>
                <h3 className="mt-1 text-sm font-semibold text-warm-50">
                  Add another character
                </h3>
              </div>
              <Button
                className="border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800"
                onClick={() => setShowCreateCharacter((current) => !current)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {showCreateCharacter ? "Hide" : "Create"}
              </Button>
            </div>

            {showCreateCharacter ? (
              <CharacterForm
                description="Keep building more characters under this account. Rogues open the live tracker immediately."
                initialValues={{
                  name: "",
                  className: "Rogue",
                  subclassName: "",
                  level: 1,
                }}
                key="create-character"
                onSubmit={async (values) => {
                  await onCreateCharacter(values)
                  setShowCreateCharacter(false)
                }}
                submitLabel="Create character"
                title="New character"
              />
            ) : null}
          </section>

          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <Button
              className="w-full border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800"
              onClick={() => void onSignOut()}
              type="button"
              variant="outline"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
