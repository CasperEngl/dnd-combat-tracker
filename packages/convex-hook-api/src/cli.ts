import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  type ConvexModuleDefinition,
  classifyConvexExports,
  generateConvexHookApiSource,
  readConvexModuleNames,
} from "./index"

export async function writeConvexHookApiFile(projectRoot: string) {
  const apiDeclarationPath = path.join(
    projectRoot,
    "convex/_generated/api.d.ts",
  )
  const apiDeclaration = await readFile(apiDeclarationPath, "utf8")
  const moduleNames = readConvexModuleNames(apiDeclaration)
  const modules = await Promise.all(
    moduleNames.map(async (moduleName) => {
      const modulePath = path.join(projectRoot, `convex/${moduleName}.ts`)
      const moduleSource = await readFile(modulePath, "utf8")

      return {
        exports: classifyConvexExports(moduleSource),
        name: moduleName,
      } satisfies ConvexModuleDefinition
    }),
  )

  const outputPath = path.join(projectRoot, "src/generated/convex-hook-api.tsx")

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, generateConvexHookApiSource(modules))
}

if (import.meta.main) {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  )
  await writeConvexHookApiFile(projectRoot)
}
