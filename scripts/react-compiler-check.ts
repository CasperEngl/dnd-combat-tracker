import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"
import { type PluginItem, transformFromAstSync } from "@babel/core"
import * as BabelParser from "@babel/parser"

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

type Report = {
  generatedAt: string
  root: string
  summary: {
    filesScanned: number
    filesWithIssues: number
    issues: number
  }
  files: FileReport[]
}

type CliOptions = {
  annotations: "github" | null
  json: boolean
  outputPath: string | null
  silentSuccess: boolean
  targetPath: string
}

const workspaceRoot = process.cwd()

function printHelp() {
  console.log(`React Compiler Check

Usage:
  bun ./scripts/react-compiler-check.ts [path] [options]

Arguments:
  path                 Root directory to scan. Defaults to src

Options:
  --json               Print machine-readable JSON output
  --annotations <type> Emit CI annotations. Supported: github
  --output <file>      Write the final report to a file
  --silent-success     Skip the success message when no issues are found
  --help, -h           Show this help message
`)
}

function parseArguments(argv: string[]): CliOptions {
  const options: CliOptions = {
    annotations: null,
    json: false,
    outputPath: null,
    silentSuccess: false,
    targetPath: "src",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === "--json") {
      options.json = true
      continue
    }

    if (argument === "--annotations") {
      const nextArgument = argv[index + 1]

      if (!nextArgument) {
        throw new Error("Expected an annotation type after --annotations.")
      }

      if (nextArgument !== "github") {
        throw new Error(`Unsupported annotation type: ${nextArgument}`)
      }

      options.annotations = nextArgument
      index += 1
      continue
    }

    if (argument === "--silent-success") {
      options.silentSuccess = true
      continue
    }

    if (argument === "--output") {
      const nextArgument = argv[index + 1]

      if (!nextArgument) {
        throw new Error("Expected a file path after --output.")
      }

      options.outputPath = nextArgument
      index += 1
      continue
    }

    if (argument === "--help" || argument === "-h") {
      printHelp()
      process.exit(0)
    }

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`)
    }

    options.targetPath = argument
  }

  return options
}

const cliOptions = parseArguments(process.argv.slice(2))
const targetRoot = path.resolve(workspaceRoot, cliOptions.targetPath)

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

function loadCompilerPlugin(): PluginItem {
  try {
    return require(
      path.join(workspaceRoot, "node_modules/babel-plugin-react-compiler"),
    )
  } catch {
    return require("babel-plugin-react-compiler")
  }
}

async function listSourceFiles(targetPath: string): Promise<string[]> {
  const targetStat = await stat(targetPath)

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

    const entries = await readdir(currentDirectory, { withFileTypes: true })

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

async function main() {
  const plugin = loadCompilerPlugin()
  const files = await listSourceFiles(targetRoot)
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
    const sourceCode = await readFile(file, "utf8")
    const relativePath = path.relative(workspaceRoot, file)

    try {
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

      if (!cliOptions.json) {
        console.log(`\n${relativePath}`)

        for (const failure of normalizedFailures) {
          printFailure(failure)
        }
      }

      if (cliOptions.annotations === "github") {
        for (const failure of normalizedFailures) {
          emitGitHubAnnotation(failure)
        }
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

      if (!cliOptions.json) {
        console.log(`\n${relativePath}`)
        printFailure(pipelineFailure)
      }

      if (cliOptions.annotations === "github") {
        emitGitHubAnnotation(pipelineFailure)
      }
    }
  }

  report.summary.filesWithIssues = fileFailureCount
  report.summary.issues = failureCount

  const output = cliOptions.json
    ? JSON.stringify(report, null, 2)
    : failureCount > 0
      ? `\nReact Compiler found ${failureCount} issue${failureCount === 1 ? "" : "s"} in ${fileFailureCount} file${fileFailureCount === 1 ? "" : "s"}.`
      : `React Compiler found no issues in ${files.length} files.`

  if (cliOptions.outputPath) {
    const outputPath = path.resolve(workspaceRoot, cliOptions.outputPath)
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${output}\n`, "utf8")
  }

  if (cliOptions.json) {
    console.log(output)
  } else if (!(cliOptions.silentSuccess && failureCount === 0)) {
    console.log(output)
  }

  if (failureCount > 0) {
    process.exitCode = 1
  }
}

await main()
