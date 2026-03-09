import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import {
  classifyConvexExports,
  generateConvexDependenciesSource,
  readConvexModuleNames,
} from "./generate-convex-dependencies"

const projectRoot = path.resolve(import.meta.dir, "..")

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

    expect(source).toContain("const defaultConvexApi = {}")
    expect(source).toContain("export const convexApi = {")
    expect(source).toContain("Provider: ConvexApiProvider")
    expect(source).toContain("useDependencies: useApiDependencies")
    expect(source).toContain("function useAuthState()")
    expect(source).toContain("function useCharactersAppStateQuery(")
    expect(source).toContain("function useCharactersCreateCharacterMutation()")
  })
})
