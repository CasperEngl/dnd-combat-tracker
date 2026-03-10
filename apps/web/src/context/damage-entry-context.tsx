import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react"
import { useRogueTracker } from "~/context/rogue-tracker-context"
import {
  createEmptyDicePool,
  type DieValue,
  getWeaponDamageTotal,
  isDicePoolCommitted,
  sumDice,
  updateDieAtIndex,
} from "~/lib/dice"

interface DamageEntryContextValue {
  shortswordWeaponDie: DieValue
  setShortswordWeaponDie: (value: number) => void
  shortswordSneakDice: DieValue[]
  setShortswordSneakDie: (index: number, value: number) => void
  nickWeaponDie: DieValue
  setNickWeaponDie: (value: number) => void
  nickSneakDice: DieValue[]
  setNickSneakDie: (index: number, value: number) => void
  shortswordWeaponDamage: number
  nickWeaponDamage: number
  shortswordSneakDamage: number
  nickSneakDamage: number
  isShortswordHitReady: boolean
  resetSelections: () => void
}

const DamageEntryContext = createContext<DamageEntryContextValue | undefined>(
  undefined,
)

export function DamageEntryProvider({ children }: { children: ReactNode }) {
  const { settings, daggerModifier, sneakAttackDiceCount } = useRogueTracker()
  const [shortswordWeaponDie, setShortswordWeaponDieState] =
    useState<DieValue>(null)
  const [shortswordSneakDice, setShortswordSneakDice] = useState<DieValue[]>(
    () => createEmptyDicePool(sneakAttackDiceCount),
  )
  const [nickWeaponDie, setNickWeaponDieState] = useState<DieValue>(null)
  const [nickSneakDice, setNickSneakDice] = useState<DieValue[]>(() =>
    createEmptyDicePool(sneakAttackDiceCount),
  )

  const resetSelections = useCallback(() => {
    setShortswordWeaponDieState(null)
    setShortswordSneakDice(createEmptyDicePool(sneakAttackDiceCount))
    setNickWeaponDieState(null)
    setNickSneakDice(createEmptyDicePool(sneakAttackDiceCount))
  }, [sneakAttackDiceCount])

  const value = {
    shortswordWeaponDie,
    setShortswordWeaponDie: (value: number) =>
      setShortswordWeaponDieState(value),
    shortswordSneakDice,
    setShortswordSneakDie: (index: number, value: number) =>
      setShortswordSneakDice((current) =>
        updateDieAtIndex(current, index, value),
      ),
    nickWeaponDie,
    setNickWeaponDie: (value: number) => setNickWeaponDieState(value),
    nickSneakDice,
    setNickSneakDie: (index: number, value: number) =>
      setNickSneakDice((current) => updateDieAtIndex(current, index, value)),
    shortswordWeaponDamage: getWeaponDamageTotal(
      shortswordWeaponDie,
      settings.dexModifier,
    ),
    nickWeaponDamage: getWeaponDamageTotal(nickWeaponDie, daggerModifier),
    shortswordSneakDamage: sumDice(shortswordSneakDice),
    nickSneakDamage: sumDice(nickSneakDice),
    isShortswordHitReady:
      shortswordWeaponDie !== null && isDicePoolCommitted(shortswordSneakDice),
    resetSelections,
  }

  return (
    <DamageEntryContext.Provider value={value}>
      {children}
    </DamageEntryContext.Provider>
  )
}

export function useDamageEntry() {
  const context = useContext(DamageEntryContext)
  if (!context) {
    throw new Error("useDamageEntry must be used within DamageEntryProvider")
  }

  return context
}
