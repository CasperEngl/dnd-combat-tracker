import { TrackerScreen } from "~/components/tracker-screen"
import { CharacterSettingsProvider } from "~/context/character-settings-context"
import { DamageEntryProvider } from "~/context/damage-entry-context"

export default function App() {
  return (
    <CharacterSettingsProvider>
      <DamageEntryProvider>
        <TrackerScreen />
      </DamageEntryProvider>
    </CharacterSettingsProvider>
  )
}
