import { TrackerScreen } from "~/components/TrackerScreen"
import { CharacterSettingsProvider } from "~/context/CharacterSettingsContext"
import { DamageEntryProvider } from "~/context/DamageEntryContext"

export default function App() {
  return (
    <CharacterSettingsProvider>
      <DamageEntryProvider>
        <TrackerScreen />
      </DamageEntryProvider>
    </CharacterSettingsProvider>
  )
}
