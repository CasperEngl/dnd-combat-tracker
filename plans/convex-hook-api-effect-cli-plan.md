# Convex Hook API Effect CLI Plan

## Goal

Move the package CLI to Effect (`@effect/cli`) and finish the internal naming cleanup from `convex-dependencies` to `convex-hook-api` while preserving current generation behavior.

## Scope

- Convert `packages/convex-hook-api/src/cli.ts` from ad-hoc script execution to an Effect CLI app.
- Add CLI options:
  - `--project-root` (default `.`)
  - `--out` (default `src/generated/convex-hook-api.tsx`)
- Keep core generation logic in the library modules unchanged.
- Rename internal script/test naming to `convex-hook-api` for consistency.

## Session Handoff Summary

This section captures the full scope of work completed in this session and what remains.

### Completed In This Session

- Replaced brittle string-contains assertions with AST assertions in generator tests.
- Added Biome formatting regression coverage for generated source.
- Updated generator output patterns (early-return override checks) to better align with Biome output stability.
- Removed old local `tmp/` usage and switched verification flow to `.tmp`/stdin formatting checks.
- Introduced package-style structure for the generator:
  - `packages/convex-hook-api/package.json`
  - `packages/convex-hook-api/src/types.ts`
  - `packages/convex-hook-api/src/discovery.ts`
  - `packages/convex-hook-api/src/model.ts`
  - `packages/convex-hook-api/src/generate-source.ts`
  - `packages/convex-hook-api/src/index.ts`
  - `packages/convex-hook-api/src/cli.ts`
- Moved repo generation script entrypoint to package CLI in root `package.json`.
- Deleted old monolithic script: `scripts/generate-convex-dependencies.ts`.
- Added model-level test coverage in `scripts/generate-convex-dependencies.test.ts`.
- Migrated `classifyConvexExports()` from regex to AST parsing (handles TS wrappers like `as`, `satisfies`, parenthesized expressions).
- Added parser edge-case test for wrapped exported handlers.
- Added `outdent` and applied it across major multiline template builders in `packages/convex-hook-api/src/generate-source.ts`.
- Added Babel emission dependencies and moved emitter to parse+print AST pipeline:
  - `@babel/generator`
  - `@babel/types`

### Current Architecture Status

- Library-first package layout is in place under `packages/convex-hook-api`.
- Model layer exists and is used by generator emission.
- Emitter currently synthesizes TS/TSX source fragments, parses to AST, then prints.
- Public generated module export is `hookApi` and output file path is `src/generated/convex-hook-api.tsx`.
- Existing app imports already target `~/generated/convex-hook-api`.

### Validation Already Performed

- Repeatedly passed:
  - `bun test scripts/generate-convex-dependencies.test.ts`
  - `bun run generate:convex-dependencies`
- Biome-format regression test passes for generated output.
- Known unrelated failure observed earlier:
  - `bun run typecheck` failed on `src/lib/character-model.test.ts` unused symbol (`resolveCharacterStatus`), outside generator scope.

### Decisions Made

- Keep internal implementation Babel-based.
- Keep generated output TypeScript/TSX.
- Use package-style directory now (not deferred).
- Keep library API + tiny CLI direction for future publishability.

### Remaining Work For Next Pass

1. Convert `packages/convex-hook-api/src/cli.ts` to Effect CLI (`@effect/cli` + `@effect/platform-node`) with:
   - root command: `convex-hook-api`
   - subcommand: `generate`
   - options: `--project-root`, `--out`
2. Rename internal script/test naming from `convex-dependencies` to `convex-hook-api`:
   - root `package.json` scripts
   - generated header regen command text in `packages/convex-hook-api/src/generate-source.ts`
   - test filename and `describe(...)` label
3. Add CLI smoke test coverage once Effect CLI is introduced.

### Optional Follow-Up (Not Required For Immediate Handoff)

- Move from parse-then-print AST to direct `@babel/types` AST node construction for maximum emitter robustness.

## Effect CLI Structure

- Use `Command.make(...)` for commands.
- Use `Command.withSubcommands(...)` to define a top-level app command with a `generate` subcommand.
- Use `Options.text(...)` with `Options.withDescription(...)`, `Options.withAlias(...)`, and `Options.withDefault(...)` for flags.
- Boot the CLI with:
  - `Command.run(...)`
  - `Effect.provide(NodeContext.layer)`
  - `NodeRuntime.runMain`

## File Changes

### 1) CLI Conversion

- Update `packages/convex-hook-api/src/cli.ts`:
  - Build an Effect command tree:
    - root command: `convex-hook-api`
    - subcommand: `generate`
  - Keep handler behavior identical:
    - read `convex/_generated/api.d.ts`
    - read referenced `convex/*.ts`
    - classify exports and generate source
    - write output file
  - Keep export for programmatic usage:
    - `writeConvexHookApiFile(projectRoot: string, outputPath?: string)`

### 2) Internal Rename Cleanup

- Update script naming in `package.json`:
  - rename `generate:convex-dependencies` to `generate:convex-hook-api`
  - update script references (`postinstall`, `dev`, `build`, `lint`, `test`, `typecheck`).
- Update generated header in `packages/convex-hook-api/src/generate-source.ts`:
  - `To regenerate, run: bun run generate:convex-hook-api`
- Rename test file:
  - `scripts/generate-convex-dependencies.test.ts` -> `scripts/generate-convex-hook-api.test.ts`
- Update test `describe(...)` name and import paths after rename.

### 3) Docs/Entrypoint Consistency

- Ensure `packages/convex-hook-api/package.json` bin/export entries still point to the CLI entry.
- Keep generated output target defaulting to `src/generated/convex-hook-api.tsx`.

## Validation

Run after implementing:

1. `bun test scripts/generate-convex-hook-api.test.ts`
2. `bun run generate:convex-hook-api`
3. Optional smoke run with custom args:
   - `bun ./packages/convex-hook-api/src/cli.ts generate --project-root . --out src/generated/convex-hook-api.tsx`
4. Keep note of unrelated existing typecheck failures outside this scope.

## Non-Goals (this pass)

- No behavior changes to model/discovery/emitter logic.
- No migration yet from parser-built ASTs to direct `@babel/types` node construction.
- No change to app runtime imports of generated hooks unless required by rename updates.
