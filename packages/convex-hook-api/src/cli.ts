import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import {
  type ConvexModuleDefinition,
  classifyConvexExports,
  generateConvexHookApiSource,
  readConvexModuleNames,
} from "./index"

function writeConvexHookApiFileEffect(projectRoot: string, outputPath: string) {
  return Effect.gen(function* () {
    const apiDeclarationPath = path.join(
      projectRoot,
      "convex/_generated/api.d.ts",
    )
    const apiDeclaration = yield* Effect.tryPromise(() =>
      readFile(apiDeclarationPath, "utf8"),
    )
    const moduleNames = readConvexModuleNames(apiDeclaration)
    const modules = yield* Effect.tryPromise(() =>
      Promise.all(
        moduleNames.map(async (moduleName) => {
          const modulePath = path.join(projectRoot, `convex/${moduleName}.ts`)
          const moduleSource = await readFile(modulePath, "utf8")

          return {
            exports: classifyConvexExports(moduleSource),
            name: moduleName,
          } satisfies ConvexModuleDefinition
        }),
      ),
    )

    yield* Effect.tryPromise(() =>
      mkdir(path.dirname(outputPath), { recursive: true }),
    )
    yield* Effect.tryPromise(() =>
      writeFile(outputPath, generateConvexHookApiSource(modules)),
    )
  })
}

export async function writeConvexHookApiFile(
  projectRoot: string,
  outputPath = path.join(projectRoot, "src/generated/convex-hook-api.tsx"),
) {
  await Effect.runPromise(writeConvexHookApiFileEffect(projectRoot, outputPath))
}

const projectRootOption = Options.text("project-root").pipe(
  Options.withAlias("p"),
  Options.withDescription(
    "Project root containing convex and src directories.",
  ),
  Options.withDefault("."),
)

const outputOption = Options.text("out").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path relative to project root."),
  Options.withDefault("src/generated/convex-hook-api.tsx"),
)

const generateCommand = Command.make(
  "generate",
  {
    out: outputOption,
    projectRoot: projectRootOption,
  },
  ({ out, projectRoot }) => {
    const resolvedProjectRoot = path.resolve(projectRoot)
    const resolvedOutputPath = path.resolve(resolvedProjectRoot, out)

    return writeConvexHookApiFileEffect(resolvedProjectRoot, resolvedOutputPath)
  },
).pipe(Command.withDescription("Generate the typed Convex hook API module."))

const rootCommand = Command.make("convex-hook-api")

const command = Command.withSubcommands(rootCommand, [generateCommand])

const cli = Command.run(command, {
  name: "convex-hook-api",
  version: "0.0.0",
})

if (import.meta.main) {
  cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
}
