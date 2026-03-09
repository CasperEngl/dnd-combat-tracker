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

export const resolveTurnMachineSlug = (classSlug: string) =>
  classSlug === "rogue" ? "rogue" : undefined

export const resolveCharacterStatus = (turnMachineSlug?: string) =>
  turnMachineSlug ? "ready" : "needs-tracker"
