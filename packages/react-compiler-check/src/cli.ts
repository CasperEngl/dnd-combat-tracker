import process from "node:process"
import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { runReactCompilerCheck } from "./index"

const targetPathArg = Args.text({ name: "path" }).pipe(
  Args.withDefault("src"),
  Args.withDescription("Root directory to scan. Defaults to src."),
)

const jsonOption = Options.boolean("json").pipe(
  Options.withDescription("Print machine-readable JSON output."),
)

const annotationsOption = Options.choice("annotations", [
  "github",
] as const).pipe(
  Options.withDefault(null),
  Options.withDescription("Emit CI annotations. Supported: github."),
)

const outputOption = Options.text("output").pipe(
  Options.withDefault(null),
  Options.withDescription("Write the final report to a file."),
)

const silentSuccessOption = Options.boolean("silent-success").pipe(
  Options.withDescription("Skip the success message when no issues are found."),
)

const command = Command.make(
  "react-compiler-check",
  {
    annotations: annotationsOption,
    json: jsonOption,
    outputPath: outputOption,
    silentSuccess: silentSuccessOption,
    targetPath: targetPathArg,
  },
  ({ annotations, json, outputPath, silentSuccess, targetPath }) =>
    runReactCompilerCheck({
      annotations,
      json,
      outputPath,
      silentSuccess,
      targetPath,
    }),
).pipe(Command.withDescription("Check React sources with the React Compiler."))

const cli = Command.run(command, {
  name: "react-compiler-check",
  version: "0.0.0",
})

if (import.meta.main) {
  cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
}
