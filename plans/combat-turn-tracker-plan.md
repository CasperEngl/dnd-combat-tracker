# Combat And Turn Tracker Plan

## Goal

Expand the app from a single-turn rogue flow into a persistent combat tracker that can:

- start and end combats explicitly
- save multiple combats for later retrieval
- keep combat-wide notes visible at all times
- keep per-turn notes visible for the selected or active turn
- track full turn history
- allow older turns to be reopened and edited
- support events or notes for things that happen between turns

## Product Direction

The app should evolve from a turn calculator into a lightweight encounter journal. The current single-turn XState flow remains useful, but it should become the engine for editing one turn inside a larger combat session.

Recommended behavior:

- multiple saved combats, not just one active combat
- combat-wide notes pinned at all times
- selected turn notes visible at all times
- turn edits update that turn and recalculate combat totals
- between-turn happenings stored as separate timeline events instead of being forced into a turn note

## Core Features

### 1. Combat Lifecycle

Add explicit combat states:

- no combat selected
- active combat
- completed combat

Required actions:

- create combat
- resume combat
- end combat
- reopen completed combat for review
- optionally continue a completed combat later if needed

### 2. Persistent Combat Records

Each combat should be saved as a durable record with:

- unique id
- name or title
- status
- created timestamp
- updated timestamp
- started timestamp
- ended timestamp
- combat-wide notes
- ordered turn history
- ordered event history

Storage should use `localStorage` first, with a clean shape that could later move to synced storage.

### 3. Turn History And Editing

Each turn should be stored as a snapshot, including:

- unique turn id
- round number
- turn order index
- current or completed state
- shortsword result
- nick result
- bonus action choice
- total damage
- turn note
- timestamps

Editing behavior:

- selecting an older turn loads it back into the active editor
- saving replaces that turn snapshot in history
- combat totals refresh immediately
- later turns remain recorded as-is unless a deeper timeline rewrite mode is added later

### 4. Between-Turn Events

Support events that do not belong cleanly to a single player turn, such as:

- enemy reaction
- held action
- environmental change
- concentration reminder
- rules correction

Each event should support:

- id
- combat id
- optional linked turn id
- type or label
- note text
- timestamp

### 5. Notes Always Visible

Notes should be first-class UI elements.

Required note surfaces:

- pinned combat notes visible at all times
- current or selected turn notes visible at all times
- notes preview in turn history
- notes visible when reopening old combats

Recommended layout:

- desktop: dedicated notes column or persistent notes panel
- mobile: sticky or always-accessible notes section without hiding it behind settings

## Technical Approach

### Keep The Existing Turn Machine

`src/rogue-turn-machine.ts` should continue to manage one turn’s resolution flow. It should not become the full combat store unless a larger refactor is clearly worth it.

### Add A Combat Session Layer

Introduce a combat-level model and persistence module, likely in new files such as:

- `src/lib/combat-state.ts`
- `src/context/combat-context.tsx`

Responsibilities:

- manage combat records
- manage selected combat
- manage selected turn
- save and load data from storage
- expose actions for create, update, end, reopen, and annotate combats

### UI Refactor Areas

Primary updates will likely land in:

- `src/components/tracker-screen.tsx`
- `src/components/tracker/sidebar.tsx`
- `src/components/tracker/flow-panels.tsx`
- `src/components/tracker/header-bar.tsx`

New UI areas likely needed:

- combat list or home screen
- persistent combat notes panel
- persistent turn notes panel
- combat history timeline
- turn editor controls
- event entry UI

## Proposed Data Model

```ts
type CombatStatus = "active" | "completed"

interface CombatRecord {
  id: string
  name: string
  status: CombatStatus
  createdAt: string
  updatedAt: string
  startedAt: string
  endedAt: string | null
  notes: string
  turns: CombatTurn[]
  events: CombatEvent[]
}

interface CombatTurn {
  id: string
  round: number
  order: number
  phase: string
  notes: string
  damageTotal: number
  shortsword: AttackResult
  nick: AttackResult
  bonusAction: BonusActionChoice | null
  updatedAt: string
}

interface CombatEvent {
  id: string
  combatId: string
  linkedTurnId?: string
  kind: string
  notes: string
  createdAt: string
}
```

## UX Notes

Important quality-of-life improvements:

- auto-save on every meaningful change
- default combat names like `Combat 1`, with rename support
- visible total damage for current combat
- visible round and turn count
- clear active versus completed combat badges
- compact previews of notes in history rows
- easy way to jump between turns and events

## Implementation Phases

### Phase 1: Persistence Foundation

- add `plans/` documentation
- create combat record types
- create storage load/save helpers
- add combat provider/context
- persist combat library and active combat selection

### Phase 2: Combat Shell

- add combat home screen or list view
- add create, resume, and end combat flows
- wire selected combat into tracker screen
- show combat metadata and totals

### Phase 3: Turn Snapshot Integration

- map the current turn machine state into storable turn snapshots
- save completed turns into combat history
- support starting the next turn inside the active combat
- support reopening an old turn into the editor

### Phase 4: Notes And Event Timeline

- add pinned combat notes
- add pinned selected-turn notes
- add between-turn event entries
- render notes and events in history

### Phase 5: Polish

- improve mobile layout for always-visible notes
- add search or filters for saved combats if needed
- refine labels and quick actions
- add empty states and recovery paths

## Success Criteria

The feature is complete when a user can:

- create and save multiple combats
- reopen any saved combat later
- read combat-wide notes immediately on load
- read and edit notes for the current or selected turn at all times
- progress through turns inside a combat
- review previous turns and events in order
- reopen an older turn and edit it
- end combat without losing history

## Files Most Likely To Change

- `src/rogue-turn-machine.ts`
- `src/components/tracker-screen.tsx`
- `src/components/tracker/sidebar.tsx`
- `src/components/tracker/flow-panels.tsx`
- `src/components/tracker/header-bar.tsx`
- `src/app.tsx`
- new combat state and storage files under `src/context/` and `src/lib/`
