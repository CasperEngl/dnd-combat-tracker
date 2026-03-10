import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { Effect } from "effect"
import { runReactCompilerCheck } from "./react-compiler-check"

async function withTempWorkspace<T>(
  run: (workspaceRoot: string) => Promise<T>,
) {
  const workspaceRoot = await mkdtemp(
    path.join(os.tmpdir(), "react-compiler-check-"),
  )

  try {
    return await run(workspaceRoot)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
}

async function writeWorkspaceFile(
  workspaceRoot: string,
  relativePath: string,
  contents: string,
) {
  const filePath = path.join(workspaceRoot, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, contents)
}

describe("react-compiler-check", () => {
  test("scans supported source files and ignores excluded directories", async () => {
    await withTempWorkspace(async (workspaceRoot) => {
      await writeWorkspaceFile(
        workspaceRoot,
        "src/main.tsx",
        "export function Main() { return <div>Hello</div> }\n",
      )
      await writeWorkspaceFile(
        workspaceRoot,
        "src/feature/state.ts",
        "export const count = 1\n",
      )
      await writeWorkspaceFile(
        workspaceRoot,
        "src/node_modules/ignored.tsx",
        "export function Ignored() { return <div>Ignored</div> }\n",
      )

      const result = await Effect.runPromise(
        runReactCompilerCheck({
          annotations: null,
          json: false,
          outputPath: null,
          silentSuccess: true,
          targetPath: "src",
          workspaceRoot,
        }),
      )

      expect(result.report.summary.filesScanned).toBe(2)
      expect(result.report.summary.filesWithIssues).toBe(0)
      expect(result.failureCount).toBe(0)
    })
  })

  test("writes a JSON report when outputPath is provided", async () => {
    await withTempWorkspace(async (workspaceRoot) => {
      await writeWorkspaceFile(
        workspaceRoot,
        "src/main.tsx",
        "export function Main() { return <div>Hello</div> }\n",
      )

      const outputPath = "reports/react-compiler-report.json"

      const result = await Effect.runPromise(
        runReactCompilerCheck({
          annotations: null,
          json: true,
          outputPath,
          silentSuccess: false,
          targetPath: "src",
          workspaceRoot,
        }),
      )

      const written = await readFile(
        path.join(workspaceRoot, outputPath),
        "utf8",
      )

      expect(result.report.summary.filesScanned).toBe(1)
      expect(written).toContain('"filesScanned": 1')
      expect(written).toContain('"filesWithIssues": 0')
    })
  })

  test("fails when the target path does not exist", async () => {
    await withTempWorkspace(async (workspaceRoot) => {
      await expect(
        Effect.runPromise(
          runReactCompilerCheck({
            annotations: null,
            json: false,
            outputPath: null,
            silentSuccess: true,
            targetPath: "missing",
            workspaceRoot,
          }),
        ),
      ).rejects.toThrow()
    })
  })
})
