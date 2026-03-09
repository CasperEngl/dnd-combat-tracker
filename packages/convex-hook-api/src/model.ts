import type { ConvexFunctionKind, ConvexModuleDefinition } from "./types"

export type HookApiModelEntry = {
  exportName: string
  implementationHookName: string
  overridePath: string
  publicHookName: string
  referencePath: string
  referenceType: string
}

export type HookApiModelModule = {
  entries: HookApiModelEntry[]
  name: string
}

export type HookApiModelSection = {
  collectionName: "actions" | "mutations" | "queries"
  dependencyTypeName:
    | "ActionDependency"
    | "MutationDependency"
    | "QueryDependency"
  kind: ConvexFunctionKind
  modules: HookApiModelModule[]
}

export type ConvexHookApiModel = {
  convexReactImports: string[]
  hasActions: boolean
  sections: HookApiModelSection[]
}

export function buildConvexHookApiModel(
  modules: ConvexModuleDefinition[],
): ConvexHookApiModel {
  const sections = (["query", "mutation", "action"] as const)
    .map((kind) => buildSection(modules, kind))
    .filter((section) => section !== null)

  const hasActions = sections.some((section) => section.kind === "action")
  const convexReactImports = [
    "useConvexAuth",
    "useMutation",
    "useQuery",
    "type OptionalRestArgsOrSkip",
    "type ReactMutation",
  ]

  if (hasActions) {
    convexReactImports.unshift("useAction")
    convexReactImports.push("type ReactAction")
  }

  return {
    convexReactImports,
    hasActions,
    sections,
  }
}

function buildSection(
  modules: ConvexModuleDefinition[],
  kind: ConvexFunctionKind,
): HookApiModelSection | null {
  const sectionModules = modules
    .map((moduleDefinition) => buildSectionModule(moduleDefinition, kind))
    .filter((moduleDefinition) => moduleDefinition !== null)

  if (sectionModules.length === 0) {
    return null
  }

  return {
    collectionName: getCollectionName(kind),
    dependencyTypeName: getDependencyTypeName(kind),
    kind,
    modules: sectionModules,
  }
}

function buildSectionModule(
  moduleDefinition: ConvexModuleDefinition,
  kind: ConvexFunctionKind,
): HookApiModelModule | null {
  const entries = moduleDefinition.exports
    .filter((entry) => entry.kind === kind)
    .map((entry) => ({
      exportName: entry.name,
      implementationHookName: toImplementationHookName(
        moduleDefinition.name,
        entry.name,
        kind,
      ),
      overridePath: `overrides.${getCollectionName(kind)}?.${moduleDefinition.name}?.${entry.name}`,
      publicHookName: toPublicHookName(entry.name, kind),
      referencePath: `api.${moduleDefinition.name}.${entry.name}`,
      referenceType: `typeof api.${moduleDefinition.name}.${entry.name}`,
    }))

  if (entries.length === 0) {
    return null
  }

  return {
    entries,
    name: moduleDefinition.name,
  }
}

function getCollectionName(
  kind: ConvexFunctionKind,
): HookApiModelSection["collectionName"] {
  return kind === "query" ? "queries" : `${kind}s`
}

function getDependencyTypeName(kind: ConvexFunctionKind) {
  return kind === "query"
    ? "QueryDependency"
    : kind === "mutation"
      ? "MutationDependency"
      : "ActionDependency"
}

function toImplementationHookName(
  moduleName: string,
  exportName: string,
  kind: ConvexFunctionKind,
) {
  return `use${toPascalCase(moduleName)}${toPascalCase(trimPrefix(exportName, kind))}${kind === "query" ? "Query" : toPascalCase(kind)}`
}

function toPublicHookName(exportName: string, kind: ConvexFunctionKind) {
  return `use${toPascalCase(trimPrefix(exportName, kind))}`
}

function trimPrefix(name: string, kind: ConvexFunctionKind) {
  if (kind === "query" && name.startsWith("get") && name.length > 3) {
    return `${name[3].toLowerCase()}${name.slice(4)}`
  }

  return name
}

function toPascalCase(value: string) {
  return value.replace(
    /(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g,
    (_match, _prefix, char: string) => char.toUpperCase(),
  )
}
