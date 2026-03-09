import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"
import { type PluginItem, transformFromAstSync } from "@babel/core"
import * as BabelParser from "@babel/parser"
import { Effect } from "effect"

const require = createRequire(import.meta.url)

const INCLUDE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
])
const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "generated",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
])
const FAILURE_KINDS = new Set([
  "CompileDiagnostic",
  "CompileError",
  "PipelineError",
])

type Language = "flow" | "typescript"

type EventLocation = {
  start?: {
    line?: number
    column?: number
  }
  end?: {
    line?: number
    column?: number
  }
  identifierName?: string
}

type EventDetailItem = {
  loc?: EventLocation
  message?: string
}

type EventDetail = {
  options?: {
    category?: string | null
  }
  reason?: string | null
  description?: string | null
  details?: EventDetailItem[]
  loc?: EventLocation
}

type CompilerEvent = {
  kind?: string
  fnName?: string | null
  fnLoc: EventLocation
  detail?: EventDetail
}

type NormalizedFailure = {
  category: string | null
  description: string | null
  file: string
  functionName: string | null
  hookReference: string | null
  kind: string
  location: {
    column: number | null
    line: number | null
  }
  reason: string
  source: string | null
}

type FileReport = {
  file: string
  issues: NormalizedFailure[]
}

export type Report = {
  generatedAt: string
  root: string
  summary: {
    filesScanned: number
    filesWithIssues: number
    issues: number
  }
  files: FileReport[]
}

export type ReactCompilerCheckOptions = {
  annotations: "github" | null
  json: boolean
  outputPath: string | null
  silentSuccess: boolean
  targetPath: string
  workspaceRoot?: string
}

export type ReactCompilerCheckResult = {
  report: Report
  output: string
  failureCount: number
  fileFailureCount: number
}

function getLanguageFromFilename(filename: string): Language {
  const extension = path.extname(filename).toLowerCase()
  return [".js", ".jsx", ".mjs"].includes(extension) ? "flow" : "typescript"
}

function formatLocation(location: {
  start?: { line?: number; column?: number }
}): string {
  const line = location.start?.line
  const column = location.start?.column

  if (typeof line !== "number") {
    return ""
  }

  if (typeof column !== "number") {
    return `:${line}`
  }

  return `:${line}:${column + 1}`
}

function getSourceLine(
  sourceCode: string,
  location?: EventLocation,
): string | null {
  const lineNumber = location?.start?.line

  if (typeof lineNumber !== "number") {
    return null
  }

  const line = sourceCode.split(/\r?\n/u)[lineNumber - 1]
  return typeof line === "string" ? line.trim() : null
}

function getPrimaryDetail(event: CompilerEvent) {
  const detail = event.detail

  if (!detail) {
    return null
  }

  const nestedDetail = detail.details?.find((item) => item.message)

  return {
    category: detail.options?.category ?? null,
    reason:
      detail.reason ??
      detail.description ??
      nestedDetail?.message ??
      "React Compiler reported a diagnostic.",
    description: detail.description ?? nestedDetail?.message ?? null,
    location: detail.loc ?? nestedDetail?.loc ?? event.fnLoc,
  }
}

function normalizeFailure(
  event: CompilerEvent,
  relativePath: string,
  sourceCode: string,
): NormalizedFailure {
  const detail = getPrimaryDetail(event)
  const location = detail?.location ?? event.fnLoc
  const sourceLine = getSourceLine(sourceCode, location)

  return {
    category: detail?.category ?? null,
    description: detail?.description ?? null,
    file: relativePath,
    functionName: event.fnName ?? null,
    hookReference: location.identifierName ?? null,
    kind: event.kind ?? "Diagnostic",
    location: {
      column:
        typeof location.start?.column === "number"
          ? location.start.column + 1
          : null,
      line:
        typeof location.start?.line === "number" ? location.start.line : null,
    },
    reason: detail?.reason ?? "Unknown React Compiler diagnostic.",
    source: sourceLine,
  }
}

function printFailure(failure: NormalizedFailure) {
  const location = formatLocation({
    start: {
      column:
        typeof failure.location.column === "number"
          ? failure.location.column - 1
          : undefined,
      line: failure.location.line ?? undefined,
    },
  })
  const header = `${failure.file}${location}`
  const functionName = failure.functionName ? ` (${failure.functionName})` : ""

  console.log(`${header}${functionName}`)
  console.log(
    `  ${failure.kind}${failure.category ? ` [${failure.category}]` : ""}: ${failure.reason}`,
  )

  if (failure.hookReference) {
    console.log(`  hook reference: ${failure.hookReference}`)
  }

  if (failure.source) {
    console.log(`  source: ${failure.source}`)
  }

  if (failure.description && failure.description !== failure.reason) {
    console.log(`  ${failure.description}`)
  }
}

function escapeGitHubAnnotationValue(value: string): string {
  return value
    .replace(/%/gu, "%25")
    .replace(/\r/gu, "%0D")
    .replace(/\n/gu, "%0A")
    .replace(/:/gu, "%3A")
    .replace(/,/gu, "%2C")
}

function emitGitHubAnnotation(failure: NormalizedFailure) {
  const metadata = [`file=${escapeGitHubAnnotationValue(failure.file)}`]

  if (typeof failure.location.line === "number") {
    metadata.push(`line=${failure.location.line}`)
  }

  if (typeof failure.location.column === "number") {
    metadata.push(`col=${failure.location.column}`)
  }

  const titleParts = [failure.kind]

  if (failure.category) {
    titleParts.push(failure.category)
  }

  if (failure.functionName) {
    titleParts.push(failure.functionName)
  }

  metadata.push(`title=${escapeGitHubAnnotationValue(titleParts.join(" - "))}`)

  const detailParts = [failure.reason]

  if (failure.hookReference) {
    detailParts.push(`Hook reference: ${failure.hookReference}`)
  }

  if (failure.source) {
    detailParts.push(`Source: ${failure.source}`)
  }

  console.log(
    `::error ${metadata.join(",")}::${escapeGitHubAnnotationValue(detailParts.join("\n"))}`,
  )
}

function loadCompilerPlugin(workspaceRoot: string): PluginItem {
  try {
    return require(
      path.join(workspaceRoot, "node_modules/babel-plugin-react-compiler"),
    )
  } catch {
    return require("babel-plugin-react-compiler")
  }
}

function listSourceFiles(targetPath: string) {
  return Effect.gen(function* () {
    const targetStat = yield* Effect.tryPromise(() => stat(targetPath))

    if (targetStat.isFile()) {
      if (!INCLUDE_EXTENSIONS.has(path.extname(targetPath).toLowerCase())) {
        return []
      }

      return [targetPath]
    }

    const sourceFiles: string[] = []
    const queue = [targetPath]

    while (queue.length > 0) {
      const currentDirectory = queue.pop()

      if (!currentDirectory) {
        continue
      }

      const entries = yield* Effect.tryPromise(() =>
        readdir(currentDirectory, { withFileTypes: true }),
      )

      for (const entry of entries) {
        const fullPath = path.join(currentDirectory, entry.name)

        if (entry.isDirectory()) {
          if (!EXCLUDED_DIRECTORIES.has(entry.name)) {
            queue.push(fullPath)
          }
          continue
        }

        if (
          entry.isFile() &&
          INCLUDE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
        ) {
          sourceFiles.push(fullPath)
        }
      }
    }

    sourceFiles.sort()
    return sourceFiles
  })
}

function checkFile(plugin: PluginItem, sourceCode: string, filename: string) {
  const failures: CompilerEvent[] = []
  const logger = {
    logEvent(_loggedFilename: string | null, event: CompilerEvent) {
      if (FAILURE_KINDS.has(event.kind ?? "")) {
        failures.push(event)
      }
    },
  }

  const ast = BabelParser.parse(sourceCode, {
    sourceFilename: filename,
    plugins: [getLanguageFromFilename(filename), "jsx"],
    sourceType: "module",
  })

  transformFromAstSync(ast, sourceCode, {
    babelrc: false,
    configFile: false,
    filename,
    highlightCode: false,
    plugins: [
      [
        plugin,
        {
          compilationMode: "infer",
          environment: {
            enableTreatRefLikeIdentifiersAsRefs: true,
          },
          logger,
          noEmit: true,
          panicThreshold: "none",
        },
      ],
    ],
    sourceType: "module",
  })

  return { failures }
}

export function runReactCompilerCheck(options: ReactCompilerCheckOptions) {
  const workspaceRoot = options.workspaceRoot ?? process.cwd()
  const targetRoot = path.resolve(workspaceRoot, options.targetPath)

  return Effect.gen(function* () {
    const plugin = loadCompilerPlugin(workspaceRoot)
    const files = yield* listSourceFiles(targetRoot)
    const report: Report = {
      generatedAt: new Date().toISOString(),
      root: path.relative(workspaceRoot, targetRoot) || ".",
      summary: {
        filesScanned: files.length,
        filesWithIssues: 0,
        issues: 0,
      },
      files: [],
    }

    let failureCount = 0
    let fileFailureCount = 0

    for (const file of files) {
      const relativePath = path.relative(workspaceRoot, file)

      try {
        const sourceCode = yield* Effect.tryPromise(() =>
          readFile(file, "utf8"),
        )
        const { failures } = checkFile(plugin, sourceCode, file)

        if (failures.length === 0) {
          continue
        }

        const normalizedFailures = failures.map((failure) =>
          normalizeFailure(failure, relativePath, sourceCode),
        )

        fileFailureCount += 1
        failureCount += normalizedFailures.length
        report.files.push({
          file: relativePath,
          issues: normalizedFailures,
        })

        if (!options.json) {
          yield* Effect.sync(() => {
            console.log(`\n${relativePath}`)

            for (const failure of normalizedFailures) {
              printFailure(failure)
            }
          })
        }

        if (options.annotations === "github") {
          yield* Effect.sync(() => {
            for (const failure of normalizedFailures) {
              emitGitHubAnnotation(failure)
            }
          })
        }
      } catch (error) {
        fileFailureCount += 1
        failureCount += 1
        const message = error instanceof Error ? error.message : String(error)
        const pipelineFailure: NormalizedFailure = {
          category: null,
          description: null,
          file: relativePath,
          functionName: null,
          hookReference: null,
          kind: "PipelineError",
          location: {
            column: null,
            line: null,
          },
          reason: message,
          source: null,
        }
        report.files.push({
          file: relativePath,
          issues: [pipelineFailure],
        })

        if (!options.json) {
          yield* Effect.sync(() => {
            console.log(`\n${relativePath}`)
            printFailure(pipelineFailure)
          })
        }

        if (options.annotations === "github") {
          yield* Effect.sync(() => {
            emitGitHubAnnotation(pipelineFailure)
          })
        }
      }
    }

    report.summary.filesWithIssues = fileFailureCount
    report.summary.issues = failureCount

    const output = options.json
      ? JSON.stringify(report, null, 2)
      : failureCount > 0
        ? `\nReact Compiler found ${failureCount} issue${
            failureCount === 1 ? "" : "s"
          } in ${fileFailureCount} file${fileFailureCount === 1 ? "" : "s"}.`
        : `React Compiler found no issues in ${files.length} files.`

    if (options.outputPath) {
      const outputPath = path.resolve(workspaceRoot, options.outputPath)
      yield* Effect.tryPromise(() =>
        mkdir(path.dirname(outputPath), { recursive: true }),
      )
      yield* Effect.tryPromise(() =>
        writeFile(outputPath, `${output}\n`, "utf8"),
      )
    }

    if (options.json) {
      yield* Effect.sync(() => {
        console.log(output)
      })
    } else if (!(options.silentSuccess && failureCount === 0)) {
      yield* Effect.sync(() => {
        console.log(output)
      })
    }

    if (failureCount > 0) {
      yield* Effect.sync(() => {
        process.exitCode = 1
      })
    }

    return {
      report,
      output,
      failureCount,
      fileFailureCount,
    } satisfies ReactCompilerCheckResult
  })
}
