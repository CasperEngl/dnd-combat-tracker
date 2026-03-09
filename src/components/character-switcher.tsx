import { ChevronDown } from "lucide-react"
import type { CharacterId, CharacterRecord } from "~/lib/character-record"

export function CharacterSwitcher({
  activeCharacterId,
  characters,
  onChange,
}: {
  activeCharacterId: CharacterId
  characters: CharacterRecord[]
  onChange: (characterId: CharacterId) => void
}) {
  return (
    <label className="relative flex min-w-[180px] items-center rounded-lg border border-warm-700 bg-warm-900 text-warm-100">
      <select
        className="h-8 w-full cursor-pointer rounded-lg bg-transparent px-3 pr-8 text-sm outline-none"
        onChange={(event) => onChange(event.target.value as CharacterId)}
        value={activeCharacterId}
      >
        {characters.map((character) => (
          <option
            className="bg-warm-900 text-warm-50"
            key={character._id}
            value={character._id}
          >
            {character.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-warm-300" />
    </label>
  )
}
