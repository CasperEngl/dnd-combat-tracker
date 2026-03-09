export type ConvexFunctionKind = "action" | "mutation" | "query"

export type ConvexModuleExport = {
  kind: ConvexFunctionKind
  name: string
}

export type ConvexModuleDefinition = {
  exports: ConvexModuleExport[]
  name: string
}
