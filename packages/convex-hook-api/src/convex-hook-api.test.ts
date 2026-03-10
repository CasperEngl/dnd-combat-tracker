import { describe, expect, test } from "bun:test"
import { mkdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import * as BabelParser from "@babel/parser"
import type { File, ObjectExpression } from "@babel/types"
import * as PlatformCommand from "@effect/platform/Command"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { Effect } from "effect"
import {
  buildConvexHookApiModel,
  classifyConvexExports,
  generateConvexHookApiSource,
  readConvexModuleNames,
} from "./index"

const projectRoot = path.resolve(import.meta.dir, "..", "..", "..")

function runCommandExitCode(command: PlatformCommand.Command) {
  return Effect.runPromise(
    PlatformCommand.exitCode(command).pipe(Effect.provide(NodeContext.layer)),
  )
}

function runCommandString(command: PlatformCommand.Command) {
  return Effect.runPromise(
    PlatformCommand.string(command).pipe(Effect.provide(NodeContext.layer)),
  )
}

function makeCommand(executable: string, args: string[], cwd = projectRoot) {
  return PlatformCommand.make(executable, ...args).pipe(
    PlatformCommand.workingDirectory(cwd),
  )
}

function getObjectPropertyNames(value: ObjectExpression) {
  return value.properties.flatMap((property) => {
    if (
      property.type !== "ObjectProperty" ||
      property.key.type !== "Identifier"
    ) {
      return []
    }

    return [property.key.name]
  })
}

function getFunctionDeclaration(
  ast: BabelParser.ParseResult<File>,
  name: string,
) {
  return ast.program.body.find(
    (node) =>
      node.type === "FunctionDeclaration" &&
      node.id?.type === "Identifier" &&
      node.id.name === name,
  )
}

describe("convex-hook-api", () => {
  test("discovers convex module paths from the generated api declaration", async () => {
    const apiDeclaration = await readFile(
      path.join(projectRoot, "packages/convex/functions/_generated/api.d.ts"),
      "utf8",
    )

    const moduleNames = readConvexModuleNames(apiDeclaration)

    expect(moduleNames).toEqual(
      expect.arrayContaining([
        "auth",
        "characterModel",
        "characterSettings",
        "characters",
        "http",
        "schemas/characterSettings",
        "schemas/characters",
        "schemas/userPreferences",
      ]),
    )
    expect(moduleNames).not.toEqual(
      expect.arrayContaining([
        "schemas_characterSettings",
        "schemas_characters",
        "schemas_userPreferences",
      ]),
    )
  })

  test("classifies public convex queries and mutations from a module source file", async () => {
    const charactersSource = await readFile(
      path.join(projectRoot, "packages/convex/functions/characters.ts"),
      "utf8",
    )

    expect(classifyConvexExports(charactersSource)).toEqual([
      { kind: "mutation", name: "createCharacter" },
      { kind: "query", name: "getAppState" },
      { kind: "query", name: "getCharacterPageState" },
      { kind: "mutation", name: "setActiveCharacter" },
      { kind: "mutation", name: "updateCharacter" },
    ])
  })

  test("classifies exported convex handlers through TS wrappers", () => {
    const source = `
const localQuery = query

const notExported = mutation({
  args: {},
  handler: async () => null,
})

export const getThing = (query({
  args: {},
  handler: async () => null,
}) satisfies unknown)

export const saveThing = mutation({
  args: {},
  handler: async () => null,
}) as unknown

export const computeThing = action({
  args: {},
  handler: async () => null,
})

export const delegatedThing = localQuery({
  args: {},
  handler: async () => null,
})
`

    expect(classifyConvexExports(source)).toEqual([
      { kind: "action", name: "computeThing" },
      { kind: "query", name: "getThing" },
      { kind: "mutation", name: "saveThing" },
    ])
  })

  test("emits a generated convex dependency context module", () => {
    const source = generateConvexHookApiSource([
      {
        name: "characterSettings",
        exports: [{ kind: "mutation", name: "upsertRogueSettings" }],
      },
      {
        name: "characters",
        exports: [
          { kind: "mutation", name: "createCharacter" },
          { kind: "query", name: "getAppState" },
        ],
      },
    ])

    const ast = BabelParser.parse(source, {
      plugins: ["typescript", "jsx"],
      sourceType: "module",
    })

    const defaultHookApi = ast.program.body.find(
      (node) =>
        node.type === "VariableDeclaration" &&
        node.declarations.some(
          (declaration) =>
            declaration.id.type === "Identifier" &&
            declaration.id.name === "defaultHookApi",
        ),
    )
    expect(defaultHookApi).toBeDefined()

    const defaultHookApiDeclaration =
      defaultHookApi?.type === "VariableDeclaration"
        ? defaultHookApi.declarations.find(
            (declaration) =>
              declaration.id.type === "Identifier" &&
              declaration.id.name === "defaultHookApi",
          )
        : undefined
    expect(defaultHookApiDeclaration?.init?.type).toBe("ObjectExpression")
    expect(
      defaultHookApiDeclaration?.init?.type === "ObjectExpression"
        ? defaultHookApiDeclaration.init.properties
        : undefined,
    ).toHaveLength(0)

    expect(getFunctionDeclaration(ast, "useAuthState")).toBeDefined()
    expect(
      getFunctionDeclaration(ast, "useCharactersAppStateQuery"),
    ).toBeDefined()
    expect(
      getFunctionDeclaration(ast, "useCharactersCreateCharacterMutation"),
    ).toBeDefined()

    const hookApiExport = ast.program.body.find(
      (node) =>
        node.type === "ExportNamedDeclaration" &&
        node.declaration?.type === "VariableDeclaration" &&
        node.declaration.declarations.some(
          (declaration) =>
            declaration.id.type === "Identifier" &&
            declaration.id.name === "hookApi",
        ),
    )
    expect(hookApiExport).toBeDefined()

    const hookApiDeclaration =
      hookApiExport?.type === "ExportNamedDeclaration" &&
      hookApiExport.declaration?.type === "VariableDeclaration"
        ? hookApiExport.declaration.declarations.find(
            (declaration) =>
              declaration.id.type === "Identifier" &&
              declaration.id.name === "hookApi",
          )
        : undefined
    expect(hookApiDeclaration?.init?.type).toBe("ObjectExpression")

    const hookApiProperties =
      hookApiDeclaration?.init?.type === "ObjectExpression"
        ? getObjectPropertyNames(hookApiDeclaration.init)
        : []
    expect(hookApiProperties).toEqual(
      expect.arrayContaining([
        "Provider",
        "useDependencies",
        "auth",
        "queries",
        "mutations",
      ]),
    )

    const authProperty =
      hookApiDeclaration?.init?.type === "ObjectExpression"
        ? hookApiDeclaration.init.properties.find(
            (property) =>
              property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.key.name === "auth",
          )
        : undefined
    expect(authProperty?.type).toBe("ObjectProperty")
    expect(
      authProperty?.type === "ObjectProperty" && authProperty.value.type,
    ).toBe("ObjectExpression")

    const authProperties =
      authProperty?.type === "ObjectProperty" &&
      authProperty.value.type === "ObjectExpression"
        ? getObjectPropertyNames(authProperty.value)
        : []
    expect(authProperties).toEqual(
      expect.arrayContaining(["useActions", "useState"]),
    )

    const queriesProperty =
      hookApiDeclaration?.init?.type === "ObjectExpression"
        ? hookApiDeclaration.init.properties.find(
            (property) =>
              property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.key.name === "queries",
          )
        : undefined
    expect(queriesProperty?.type).toBe("ObjectProperty")
    expect(
      queriesProperty?.type === "ObjectProperty" && queriesProperty.value.type,
    ).toBe("ObjectExpression")

    const charactersQueryProperty =
      queriesProperty?.type === "ObjectProperty" &&
      queriesProperty.value.type === "ObjectExpression"
        ? queriesProperty.value.properties.find(
            (property) =>
              property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.key.name === "characters",
          )
        : undefined
    expect(charactersQueryProperty?.type).toBe("ObjectProperty")
    expect(
      charactersQueryProperty?.type === "ObjectProperty" &&
        charactersQueryProperty.value.type,
    ).toBe("ObjectExpression")

    const queryHookProperties =
      charactersQueryProperty?.type === "ObjectProperty" &&
      charactersQueryProperty.value.type === "ObjectExpression"
        ? getObjectPropertyNames(charactersQueryProperty.value)
        : []
    expect(queryHookProperties).toEqual(expect.arrayContaining(["useAppState"]))

    const mutationsProperty =
      hookApiDeclaration?.init?.type === "ObjectExpression"
        ? hookApiDeclaration.init.properties.find(
            (property) =>
              property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.key.name === "mutations",
          )
        : undefined
    expect(mutationsProperty?.type).toBe("ObjectProperty")
    expect(
      mutationsProperty?.type === "ObjectProperty" &&
        mutationsProperty.value.type,
    ).toBe("ObjectExpression")

    const charactersMutationProperty =
      mutationsProperty?.type === "ObjectProperty" &&
      mutationsProperty.value.type === "ObjectExpression"
        ? mutationsProperty.value.properties.find(
            (property) =>
              property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.key.name === "characters",
          )
        : undefined
    expect(charactersMutationProperty?.type).toBe("ObjectProperty")
    expect(
      charactersMutationProperty?.type === "ObjectProperty" &&
        charactersMutationProperty.value.type,
    ).toBe("ObjectExpression")

    const mutationHookProperties =
      charactersMutationProperty?.type === "ObjectProperty" &&
      charactersMutationProperty.value.type === "ObjectExpression"
        ? getObjectPropertyNames(charactersMutationProperty.value)
        : []
    expect(mutationHookProperties).toEqual(
      expect.arrayContaining(["useCreateCharacter"]),
    )
  })

  test("builds a normalized hook api model", () => {
    const model = buildConvexHookApiModel([
      {
        name: "characterSettings",
        exports: [{ kind: "mutation", name: "upsertRogueSettings" }],
      },
      {
        name: "characters",
        exports: [
          { kind: "mutation", name: "createCharacter" },
          { kind: "query", name: "getAppState" },
          { kind: "query", name: "getCharacterPageState" },
        ],
      },
    ])

    expect(model.convexReactImports).toEqual([
      "useConvexAuth",
      "useMutation",
      "useQuery",
      "type OptionalRestArgsOrSkip",
      "type ReactMutation",
    ])
    expect(model.hasActions).toBe(false)
    expect(
      model.sections.map((section) => ({
        collectionName: section.collectionName,
        kind: section.kind,
        modules: section.modules.map((moduleDefinition) => ({
          entries: moduleDefinition.entries.map((entry) => ({
            implementationHookName: entry.implementationHookName,
            publicHookName: entry.publicHookName,
          })),
          name: moduleDefinition.name,
        })),
      })),
    ).toEqual([
      {
        collectionName: "queries",
        kind: "query",
        modules: [
          {
            entries: [
              {
                implementationHookName: "useCharactersAppStateQuery",
                publicHookName: "useAppState",
              },
              {
                implementationHookName: "useCharactersCharacterPageStateQuery",
                publicHookName: "useCharacterPageState",
              },
            ],
            name: "characters",
          },
        ],
      },
      {
        collectionName: "mutations",
        kind: "mutation",
        modules: [
          {
            entries: [
              {
                implementationHookName:
                  "useCharacterSettingsUpsertRogueSettingsMutation",
                publicHookName: "useUpsertRogueSettings",
              },
            ],
            name: "characterSettings",
          },
          {
            entries: [
              {
                implementationHookName: "useCharactersCreateCharacterMutation",
                publicHookName: "useCreateCharacter",
              },
            ],
            name: "characters",
          },
        ],
      },
    ])
  })

  test("emits source that already matches Biome formatting", async () => {
    const source = generateConvexHookApiSource([
      {
        name: "characterSettings",
        exports: [{ kind: "mutation", name: "upsertRogueSettings" }],
      },
      {
        name: "characters",
        exports: [
          { kind: "mutation", name: "createCharacter" },
          { kind: "query", name: "getAppState" },
          { kind: "query", name: "getCharacterPageState" },
        ],
      },
    ])

    const formattedSource = await runCommandString(
      makeCommand("bunx", [
        "biome",
        "format",
        "--stdin-file-path",
        "packages/convex/client/hook-api.tsx",
      ]).pipe(PlatformCommand.feed(source)),
    )

    expect(source).toBe(formattedSource)
  })

  test("cli generate supports project root and output options", async () => {
    const outputPath = path.join(
      projectRoot,
      ".tmp/convex-hook-api-cli-output.tsx",
    )

    await mkdir(path.dirname(outputPath), { recursive: true })
    await rm(outputPath, { force: true })

    const exitCode = await runCommandExitCode(
      makeCommand("bun", [
        "./packages/convex-hook-api/src/cli.ts",
        "generate",
        "--project-root",
        ".",
        "--functions-dir",
        "packages/convex/functions",
        "--out",
        ".tmp/convex-hook-api-cli-output.tsx",
      ]),
    )

    expect(Number(exitCode)).toBe(0)

    const generatedSource = await readFile(outputPath, "utf8")

    expect(generatedSource).toContain("export const hookApi = {")
    expect(generatedSource).toContain("function HookApiProvider(")
    expect(generatedSource).toContain(
      'from "../packages/convex/functions/_generated/api.js"',
    )

    await rm(outputPath, { force: true })
  })

  test("cli generate defaults to the monorepo convex layout", async () => {
    const exitCode = await runCommandExitCode(
      makeCommand("bun", [
        "./packages/convex-hook-api/src/cli.ts",
        "generate",
        "--project-root",
        ".",
      ]),
    )

    expect(Number(exitCode)).toBe(0)

    const generatedSource = await readFile(
      path.join(projectRoot, "packages/convex/client/hook-api.tsx"),
      "utf8",
    )

    expect(generatedSource).toContain('from "../functions/_generated/api.js"')
  })

  test("cli generate fails for an invalid project root", async () => {
    const missingProjectRoot = path.join(
      projectRoot,
      ".tmp/convex-hook-api-missing-project",
    )

    await rm(missingProjectRoot, { force: true, recursive: true })

    const exitCode = await runCommandExitCode(
      makeCommand("bun", [
        "./packages/convex-hook-api/src/cli.ts",
        "generate",
        "--project-root",
        missingProjectRoot,
      ]),
    )

    expect(Number(exitCode)).not.toBe(0)
  })
})
