import { describe, expect, test } from "bun:test"
import { spawn } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import * as BabelParser from "@babel/parser"
import type { File, ObjectExpression } from "@babel/types"
import {
  buildConvexHookApiModel,
  classifyConvexExports,
  generateConvexHookApiSource,
  readConvexModuleNames,
} from "./src/index"

const projectRoot = path.resolve(import.meta.dir, "..", "..")

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

describe("generate-convex-dependencies", () => {
  test("discovers convex module names from the generated api declaration", async () => {
    const apiDeclaration = await readFile(
      path.join(projectRoot, "convex/_generated/api.d.ts"),
      "utf8",
    )

    expect(readConvexModuleNames(apiDeclaration)).toEqual([
      "auth",
      "characterModel",
      "characterSettings",
      "characters",
      "http",
    ])
  })

  test("classifies public convex queries and mutations from a module source file", async () => {
    const charactersSource = await readFile(
      path.join(projectRoot, "convex/characters.ts"),
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

    const formattedSource = await new Promise<string>((resolve, reject) => {
      const child = spawn(
        "bunx",
        [
          "biome",
          "format",
          "--stdin-file-path",
          "src/generated/convex-hook-api.tsx",
        ],
        {
          cwd: projectRoot,
          stdio: ["pipe", "pipe", "pipe"],
        },
      )

      let stdout = ""
      let stderr = ""

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString()
      })
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString()
      })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout)
          return
        }

        reject(new Error(stderr || `Biome exited with code ${code}`))
      })

      child.stdin.end(source)
    })

    expect(source).toBe(formattedSource)
  })
})
