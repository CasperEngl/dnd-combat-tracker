# AGENTS.md

- Treat this app as a turn-flow tracker, not a generic dice roller.
- The current implementation is a single-turn flow; the likely long-term direction is a persistent combat tracker / encounter journal.
- Keep turn rules in `src/rogue-turn-machine.ts` when possible instead of spreading rule logic across components.
- Preserve explicit player-facing rule reminders in the UI; avoid hiding important rules decisions behind automation.
- The current flow is rogue-specific, but new product and UX decisions should avoid baking in assumptions that make future class support harder.
- Damage entry is intentionally manual: users choose each die result before confirming a hit.
- Damage-entry selections live outside the XState machine in `src/context/damage-entry-context.tsx`; resolved turn state lives in the machine.
- If dice selections clear unexpectedly, check `src/components/tracker-screen.tsx` first because selections reset on phase and character-setting changes.
- Character settings currently persist in `localStorage`; turn history and combat sessions do not yet persist.
- Use Effect for backend state management and backend logic; new backend code should be written in Effect.
- If you touch existing backend code and there is a clear opportunity to simplify or strengthen it by moving it to Effect, prefer doing so.
- Add newly discovered non-obvious rules, debugging traps, persistence constraints, and emerging project conventions to this file.
- Keep additions short and factual so this file stays useful as a lightweight list of guidelines.
