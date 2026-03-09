import { describe, expect, test } from "bun:test"
import { spawn } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import * as BabelParser from "@babel/parser"
import type { File, ObjectExpression } from "@babel/types"
import {
  classifyConvexExports,
  generateConvexDependenciesSource,
  readConvexModuleNames,
} from "./generate-convex-dependencies"

const projectRoot = path.resolve(import.meta.dir, "..")

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

  test("emits a generated convex dependency context module", () => {
    const source = generateConvexDependenciesSource([
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

    const defaultConvexApi = ast.program.body.find(
      (node) =>
        node.type === "VariableDeclaration" &&
        node.declarations.some(
          (declaration) =>
            declaration.id.type === "Identifier" &&
            declaration.id.name === "defaultConvexApi",
        ),
    )
    expect(defaultConvexApi).toBeDefined()

    const defaultConvexApiDeclaration =
      defaultConvexApi?.type === "VariableDeclaration"
        ? defaultConvexApi.declarations.find(
            (declaration) =>
              declaration.id.type === "Identifier" &&
              declaration.id.name === "defaultConvexApi",
          )
        : undefined
    expect(defaultConvexApiDeclaration?.init?.type).toBe("ObjectExpression")
    expect(
      defaultConvexApiDeclaration?.init?.type === "ObjectExpression"
        ? defaultConvexApiDeclaration.init.properties
        : undefined,
    ).toHaveLength(0)

    expect(getFunctionDeclaration(ast, "useAuthState")).toBeDefined()
    expect(
      getFunctionDeclaration(ast, "useCharactersAppStateQuery"),
    ).toBeDefined()
    expect(
      getFunctionDeclaration(ast, "useCharactersCreateCharacterMutation"),
    ).toBeDefined()

    const convexApiExport = ast.program.body.find(
      (node) =>
        node.type === "ExportNamedDeclaration" &&
        node.declaration?.type === "VariableDeclaration" &&
        node.declaration.declarations.some(
          (declaration) =>
            declaration.id.type === "Identifier" &&
            declaration.id.name === "convexApi",
        ),
    )
    expect(convexApiExport).toBeDefined()

    const convexApiDeclaration =
      convexApiExport?.type === "ExportNamedDeclaration" &&
      convexApiExport.declaration?.type === "VariableDeclaration"
        ? convexApiExport.declaration.declarations.find(
            (declaration) =>
              declaration.id.type === "Identifier" &&
              declaration.id.name === "convexApi",
          )
        : undefined
    expect(convexApiDeclaration?.init?.type).toBe("ObjectExpression")

    const convexApiProperties =
      convexApiDeclaration?.init?.type === "ObjectExpression"
        ? getObjectPropertyNames(convexApiDeclaration.init)
        : []
    expect(convexApiProperties).toEqual(
      expect.arrayContaining([
        "Provider",
        "useDependencies",
        "auth",
        "queries",
        "mutations",
      ]),
    )

    const authProperty =
      convexApiDeclaration?.init?.type === "ObjectExpression"
        ? convexApiDeclaration.init.properties.find(
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
      convexApiDeclaration?.init?.type === "ObjectExpression"
        ? convexApiDeclaration.init.properties.find(
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
      convexApiDeclaration?.init?.type === "ObjectExpression"
        ? convexApiDeclaration.init.properties.find(
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

  test("emits source that already matches Biome formatting", async () => {
    const source = generateConvexDependenciesSource([
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
          "src/generated/convex-api.tsx",
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
