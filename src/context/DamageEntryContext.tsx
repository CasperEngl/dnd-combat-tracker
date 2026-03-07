import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { useCharacterSettings } from "~/context/CharacterSettingsContext"
import {
  allDiceSelected,
  createEmptyDicePool,
  type DieValue,
  getWeaponDamageTotal,
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
  isNickSneakReady: boolean
  resetSelections: () => void
}

const DamageEntryContext = createContext<DamageEntryContextValue | undefined>(
  undefined,
)

export function DamageEntryProvider({ children }: { children: ReactNode }) {
  const { settings, daggerModifier, sneakAttackDiceCount } =
    useCharacterSettings()
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

  const value = useMemo(
    () => ({
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
        shortswordWeaponDie !== null && allDiceSelected(shortswordSneakDice),
      isNickSneakReady: allDiceSelected(nickSneakDice),
      resetSelections,
    }),
    [
      daggerModifier,
      nickSneakDice,
      nickWeaponDie,
      resetSelections,
      settings.dexModifier,
      shortswordSneakDice,
      shortswordWeaponDie,
    ],
  )

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
