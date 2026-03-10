export const clampCharacterLevel = (value: number) =>
  Math.min(20, Math.max(1, Math.floor(value || 1)))

export const normalizeCharacterName = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "Unnamed Character"
}

export const normalizeClassName = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "Adventurer"
}

export const normalizeSubclassName = (value?: string) => {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : undefined
}

export const toClassSlug = (value: string) =>
  normalizeClassName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "adventurer"

export type FlowFamilySlug = "dual-wield-skirmisher" | "martial-basic"

export type TrackerSlug = "rogue" | "martial-basic"

export type CharacterStatus = "ready" | "needs-tracker" | "archived"

export interface CharacterFlowResolution {
  classSlug: string
  flowFamilySlug?: FlowFamilySlug
  trackerSlug?: TrackerSlug
  status: Exclude<CharacterStatus, "archived">
}

export const resolveCharacterFlow = (
  classSlug: string,
): CharacterFlowResolution => {
  if (classSlug === "rogue") {
    return {
      classSlug,
      flowFamilySlug: "dual-wield-skirmisher",
      trackerSlug: "rogue",
      status: "ready",
    }
  }

  return {
    classSlug,
    flowFamilySlug: undefined,
    trackerSlug: undefined,
    status: "needs-tracker",
  }
}

export const resolveTurnMachineSlug = (classSlug: string) =>
  resolveCharacterFlow(classSlug).trackerSlug

export const resolveCharacterStatus = (trackerSlug?: TrackerSlug) =>
  trackerSlug ? "ready" : "needs-tracker"
