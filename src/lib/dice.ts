export type DieValue = number | null

export const createRange = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

export const createEmptyDicePool = (count: number): DieValue[] =>
  Array.from({ length: count }, () => null)

export const allDiceSelected = (values: DieValue[]) =>
  values.every((value) => value !== null)

export const sumDice = (values: DieValue[]) =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0)

export const updateDieAtIndex = (
  values: DieValue[],
  index: number,
  nextValue: number,
): DieValue[] => values.map((value, i) => (i === index ? nextValue : value))

export const formatModifier = (modifier: number) => {
  if (modifier === 0) {
    return ""
  }

  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`
}

export const formatSignedNumber = (value: number) =>
  value > 0 ? `+${value}` : `${value}`

export const formatWeaponFormula = (dieSides: number, modifier: number) =>
  `1d${dieSides}${formatModifier(modifier)}`

export const getWeaponDamageTotal = (roll: DieValue, modifier: number) =>
  roll === null ? 0 : Math.max(0, roll + modifier)
