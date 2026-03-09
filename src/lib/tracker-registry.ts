import type { FlowFamilySlug, TrackerSlug } from "~/lib/character-model"

export interface TrackerDefinition {
  trackerSlug: TrackerSlug
  flowFamilySlug: FlowFamilySlug
  label: string
}

const trackerDefinitions: Record<TrackerSlug, TrackerDefinition> = {
  rogue: {
    trackerSlug: "rogue",
    flowFamilySlug: "dual-wield-skirmisher",
    label: "Rogue",
  },
  "martial-basic": {
    trackerSlug: "martial-basic",
    flowFamilySlug: "martial-basic",
    label: "Martial (placeholder)",
  },
}

export const getTrackerDefinition = (trackerSlug?: string) =>
  trackerSlug && trackerSlug in trackerDefinitions
    ? trackerDefinitions[trackerSlug as TrackerSlug]
    : undefined

export const getTrackerDefinitionForCharacter = (character: {
  trackerSlug?: string
}) => getTrackerDefinition(character.trackerSlug)
