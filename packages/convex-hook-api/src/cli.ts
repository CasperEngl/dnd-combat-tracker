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

function normalizeRelativeImportPath(value: string) {
  const normalizedPath = value.split(path.sep).join("/")

  if (normalizedPath.startsWith(".")) {
    return normalizedPath
  }

  return `./${normalizedPath}`
}

function writeConvexHookApiFileEffect(
  projectRoot: string,
  functionsDir: string,
  outputPath: string,
) {
  return Effect.gen(function* () {
    const resolvedFunctionsDir = path.join(projectRoot, functionsDir)
    const apiDeclarationPath = path.join(
      resolvedFunctionsDir,
      "_generated/api.d.ts",
    )
    const apiDeclaration = yield* Effect.tryPromise(() =>
      readFile(apiDeclarationPath, "utf8"),
    )
    const moduleNames = readConvexModuleNames(apiDeclaration)
    const modules = yield* Effect.tryPromise(() =>
      Promise.all(
        moduleNames.map(async (moduleName) => {
          const modulePath = path.join(resolvedFunctionsDir, `${moduleName}.ts`)
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
    const generatedApiImportPath = normalizeRelativeImportPath(
      path.relative(
        path.dirname(outputPath),
        path.join(resolvedFunctionsDir, "_generated/api.js"),
      ),
    )
    yield* Effect.tryPromise(() =>
      writeFile(
        outputPath,
        generateConvexHookApiSource(modules, {
          apiImportPath: generatedApiImportPath,
        }),
      ),
    )
  })
}

export async function writeConvexHookApiFile(
  projectRoot: string,
  functionsDir = "packages/convex/functions",
  outputPath = path.join(projectRoot, "packages/convex/client/hook-api.tsx"),
) {
  await Effect.runPromise(
    writeConvexHookApiFileEffect(projectRoot, functionsDir, outputPath),
  )
}

const projectRootOption = Options.text("project-root").pipe(
  Options.withAlias("p"),
  Options.withDescription(
    "Project root containing the workspace and convex configuration.",
  ),
  Options.withDefault("."),
)

const functionsDirOption = Options.text("functions-dir").pipe(
  Options.withAlias("f"),
  Options.withDescription(
    "Convex functions directory relative to project root.",
  ),
  Options.withDefault("packages/convex/functions"),
)

const outputOption = Options.text("out").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path relative to project root."),
  Options.withDefault("packages/convex/client/hook-api.tsx"),
)

const generateCommand = Command.make(
  "generate",
  {
    functionsDir: functionsDirOption,
    out: outputOption,
    projectRoot: projectRootOption,
  },
  ({ functionsDir, out, projectRoot }) => {
    const resolvedProjectRoot = path.resolve(projectRoot)
    const resolvedOutputPath = path.resolve(resolvedProjectRoot, out)

    return writeConvexHookApiFileEffect(
      resolvedProjectRoot,
      functionsDir,
      resolvedOutputPath,
    )
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
