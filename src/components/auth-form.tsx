import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { convexApi } from "~/generated/convex-api"

type AuthFormValues = {
  email: string
  password: string
}

function FieldError({ errors }: { errors: string[] }) {
  return errors.length > 0 ? (
    <p className="mt-2 text-xs text-red-300">{errors[0]}</p>
  ) : null
}

export function AuthForm() {
  const { signIn } = convexApi.auth.useActions()
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } satisfies AuthFormValues,
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      await signIn("password", {
        ...value,
        flow,
      })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_38%),linear-gradient(180deg,#2c0f06,#1d0a04)] px-4 py-10 text-warm-100">
      <div className="w-full max-w-md rounded-2xl border border-warm-700 bg-warm-900/95 p-6 shadow-2xl shadow-black/30">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
          Convex Auth
        </p>
        <h1 className="mt-1 text-2xl font-bold text-warm-50">
          Sign in to your roster
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-warm-300">
          Characters now live in your account, so sign in before you start
          tracking turns.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit().catch((error: unknown) => {
              setErrorMessage(
                error instanceof Error ? error.message : "Unable to continue.",
              )
            })
          }}
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                value.includes("@") ? undefined : "Enter a valid email.",
            }}
          >
            {(field) => (
              <div>
                <Label
                  className="mb-2 block text-xs font-semibold text-warm-200"
                  htmlFor={field.name}
                >
                  Email
                </Label>
                <Input
                  className="border-warm-700 bg-warm-950 text-warm-50"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors as string[]} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length >= 8 ? undefined : "Use at least 8 characters.",
            }}
          >
            {(field) => (
              <div>
                <Label
                  className="mb-2 block text-xs font-semibold text-warm-200"
                  htmlFor={field.name}
                >
                  Password
                </Label>
                <Input
                  className="border-warm-700 bg-warm-950 text-warm-50"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors as string[]} />
              </div>
            )}
          </form.Field>

          {errorMessage ? (
            <div className="rounded-lg border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {errorMessage}
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
                {flow === "signIn" ? "Sign in" : "Create account"}
              </Button>
            )}
          </form.Subscribe>
          <Button
            className="w-full border-warm-700 bg-warm-900 text-warm-100 hover:bg-warm-800"
            onClick={() =>
              setFlow((current) => (current === "signIn" ? "signUp" : "signIn"))
            }
            type="button"
            variant="outline"
          >
            {flow === "signIn"
              ? "Need an account? Sign up"
              : "Already signed up? Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
