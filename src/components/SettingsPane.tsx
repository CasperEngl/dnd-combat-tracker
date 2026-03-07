import { Settings2 } from "lucide-react"
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
import {
  type CharacterSettings,
  clampDexModifier,
  clampRogueLevel,
  getSneakAttackDiceCount,
} from "~/lib/character-settings"

interface SettingsPaneProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CharacterSettings
  onSettingsChange: (settings: CharacterSettings) => void
}

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function SettingsPane({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsPaneProps) {
  const sneakAttackDiceCount = getSneakAttackDiceCount(settings.rogueLevel)

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
            Character tuning
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-warm-300">
            Adjust your rogue level, Dex modifier, and whether Dex adds to the
            Nick dagger. Changes save automatically to local storage.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-5 py-4">
          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Rogue
                </p>
                <h3 className="mt-1 text-sm font-semibold text-warm-50">
                  Level and Sneak Attack
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

            <Label
              className="mb-2 block text-xs font-semibold text-warm-200"
              htmlFor="rogue-level"
            >
              Rogue level
            </Label>
            <div className="flex items-center gap-2">
              <Button
                className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    rogueLevel: clampRogueLevel(settings.rogueLevel - 1),
                  })
                }
                size="icon-sm"
                type="button"
                variant="outline"
              >
                -
              </Button>
              <Input
                className="border-warm-700 bg-warm-900 text-center font-mono text-warm-50"
                id="rogue-level"
                inputMode="numeric"
                max={20}
                min={1}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    rogueLevel: clampRogueLevel(
                      parseNumberInput(event.target.value, settings.rogueLevel),
                    ),
                  })
                }
                type="number"
                value={settings.rogueLevel}
              />
              <Button
                className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    rogueLevel: clampRogueLevel(settings.rogueLevel + 1),
                  })
                }
                size="icon-sm"
                type="button"
                variant="outline"
              >
                +
              </Button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-warm-300">
              Sneak Attack scales automatically from rogue level using the
              standard progression.
            </p>
          </section>

          <section className="rounded-xl border border-warm-700 bg-warm-900 p-4">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
              Weapons
            </p>
            <h3 className="mt-1 text-sm font-semibold text-warm-50">
              Damage modifiers
            </h3>

            <Label
              className="mb-2 mt-3 block text-xs font-semibold text-warm-200"
              htmlFor="dex-modifier"
            >
              Dex modifier
            </Label>
            <div className="flex items-center gap-2">
              <Button
                className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    dexModifier: clampDexModifier(settings.dexModifier - 1),
                  })
                }
                size="icon-sm"
                type="button"
                variant="outline"
              >
                -
              </Button>
              <Input
                className="border-warm-700 bg-warm-900 text-center font-mono text-warm-50"
                id="dex-modifier"
                inputMode="numeric"
                max={10}
                min={-5}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    dexModifier: clampDexModifier(
                      parseNumberInput(
                        event.target.value,
                        settings.dexModifier,
                      ),
                    ),
                  })
                }
                type="number"
                value={settings.dexModifier}
              />
              <Button
                className="border-warm-700 bg-warm-800 text-warm-50 hover:bg-warm-700"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    dexModifier: clampDexModifier(settings.dexModifier + 1),
                  })
                }
                size="icon-sm"
                type="button"
                variant="outline"
              >
                +
              </Button>
            </div>

            <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-warm-700 bg-warm-950/70 px-3 py-3">
              <div className="space-y-1">
                <Label
                  className="text-xs font-semibold text-warm-100"
                  htmlFor="apply-dex-offhand"
                >
                  Apply Dex to both weapons
                </Label>
                <p className="text-xs leading-relaxed text-warm-300">
                  Turn this on if your Nick dagger should add your Dex modifier
                  to damage as well.
                </p>
              </div>
              <Switch
                checked={settings.applyDexToBothWeapons}
                className="data-checked:bg-amber-600 data-unchecked:bg-warm-800"
                id="apply-dex-offhand"
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    applyDexToBothWeapons: checked,
                  })
                }
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
