import * as BabelParser from "@babel/parser"
import type { CallExpression, Expression, Identifier } from "@babel/types"
import type { ConvexFunctionKind, ConvexModuleExport } from "./types"

export function readConvexModuleNames(sourceText: string) {
  const ast = BabelParser.parse(sourceText, {
    plugins: ["typescript"],
    sourceType: "module",
  })

  return ast.program.body.flatMap((statement) => {
    if (statement.type !== "ImportDeclaration") {
      return []
    }

    if (statement.importKind !== "type") {
      return []
    }

    if (!statement.source.value.startsWith("../")) {
      return []
    }

    const namespaceSpecifier = statement.specifiers.find(
      (specifier) => specifier.type === "ImportNamespaceSpecifier",
    )

    if (!namespaceSpecifier) {
      return []
    }

    const sourceValue = statement.source.value
    const trimmed = sourceValue.startsWith("../")
      ? sourceValue.slice(3)
      : sourceValue
    const withoutExtension = trimmed.replace(/\.js$/, "")

    return [withoutExtension]
  })
}

export function classifyConvexExports(
  sourceText: string,
): ConvexModuleExport[] {
  const ast = BabelParser.parse(sourceText, {
    plugins: ["typescript"],
    sourceType: "module",
  })

  return ast.program.body
    .flatMap((statement) => {
      if (
        statement.type !== "ExportNamedDeclaration" ||
        statement.declaration?.type !== "VariableDeclaration"
      ) {
        return []
      }

      return statement.declaration.declarations.flatMap((declaration) => {
        if (declaration.id.type !== "Identifier") {
          return []
        }

        const kind = getConvexFunctionKind(declaration.init)

        if (!kind) {
          return []
        }

        return [
          {
            kind,
            name: declaration.id.name,
          },
        ]
      })
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

function getConvexFunctionKind(
  expression: Expression | null | undefined,
): ConvexFunctionKind | null {
  if (!expression) {
    return null
  }

  if (expression.type === "CallExpression") {
    return getConvexFunctionKindFromCallExpression(expression)
  }

  if (expression.type === "TSAsExpression") {
    return getConvexFunctionKind(expression.expression)
  }

  if (expression.type === "TSSatisfiesExpression") {
    return getConvexFunctionKind(expression.expression)
  }

  if (expression.type === "TSNonNullExpression") {
    return getConvexFunctionKind(expression.expression)
  }

  if (expression.type === "ParenthesizedExpression") {
    return getConvexFunctionKind(expression.expression)
  }

  return null
}

function getConvexFunctionKindFromCallExpression(
  expression: CallExpression,
): ConvexFunctionKind | null {
  const callee = expression.callee

  if (callee.type !== "Identifier") {
    return null
  }

  return identifierNameToFunctionKind(callee)
}

function identifierNameToFunctionKind(
  identifier: Identifier,
): ConvexFunctionKind | null {
  if (identifier.name === "query") {
    return "query"
  }

  if (identifier.name === "mutation") {
    return "mutation"
  }

  if (identifier.name === "action") {
    return "action"
  }

  return null
}
