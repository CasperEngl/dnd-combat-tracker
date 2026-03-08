import { useForm } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  clampCharacterLevel,
  normalizeClassName,
  normalizeSubclassName,
} from "~/lib/character-model"
import type { CharacterFormValues } from "~/lib/character-record"

const parseLevelInput = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? clampCharacterLevel(parsed) : fallback
}

function FieldError({ errors }: { errors: string[] }) {
  return errors.length > 0 ? (
    <p className="mt-2 text-xs text-red-300">{errors[0]}</p>
  ) : null
}

export function CharacterForm({
  description,
  initialValues,
  submitLabel,
  title,
  onSubmit,
}: {
  description: string
  initialValues: CharacterFormValues
  submitLabel: string
  title: string
  onSubmit: (values: CharacterFormValues) => Promise<void> | void
}) {
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        name: value.name.trim(),
        className: normalizeClassName(value.className),
        subclassName: normalizeSubclassName(value.subclassName) ?? "",
        level: clampCharacterLevel(value.level),
      })
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div>
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-amber-400">
          Character
        </p>
        <h2 className="mt-1 text-lg font-semibold text-warm-50">{title}</h2>
        <p className="mt-1 text-sm text-warm-300">{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim().length > 0 ? undefined : "Name is required.",
          }}
        >
          {(field) => (
            <div className="sm:col-span-2">
              <Label
                className="mb-2 block text-xs font-semibold text-warm-200"
                htmlFor={field.name}
              >
                Name
              </Label>
              <Input
                className="border-warm-700 bg-warm-950 text-warm-50"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Mira Quickstep"
                required
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors as string[]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="className"
          validators={{
            onChange: ({ value }) =>
              value.trim().length > 0 ? undefined : "Class is required.",
          }}
        >
          {(field) => (
            <div>
              <Label
                className="mb-2 block text-xs font-semibold text-warm-200"
                htmlFor={field.name}
              >
                Class
              </Label>
              <Input
                className="border-warm-700 bg-warm-950 text-warm-50"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Rogue"
                required
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors as string[]} />
            </div>
          )}
        </form.Field>

        <form.Field name="subclassName">
          {(field) => (
            <div>
              <Label
                className="mb-2 block text-xs font-semibold text-warm-200"
                htmlFor={field.name}
              >
                Subclass
              </Label>
              <Input
                className="border-warm-700 bg-warm-950 text-warm-50"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Arcane Trickster"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="level"
          validators={{
            onChange: ({ value }) =>
              value >= 1 && value <= 20
                ? undefined
                : "Level must stay between 1 and 20.",
          }}
        >
          {(field) => (
            <div className="sm:col-span-2">
              <Label
                className="mb-2 block text-xs font-semibold text-warm-200"
                htmlFor={field.name}
              >
                Level
              </Label>
              <Input
                className="border-warm-700 bg-warm-950 text-warm-50"
                id={field.name}
                inputMode="numeric"
                max={20}
                min={1}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    parseLevelInput(event.target.value, field.state.value),
                  )
                }
                required
                type="number"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors as string[]} />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            className="w-full bg-amber-600 text-white hover:bg-amber-500"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            {submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
