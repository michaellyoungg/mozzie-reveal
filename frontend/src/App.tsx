import { useHashRoute } from './hooks/useHashRoute'
import { useGameState } from './hooks/useGameSelectors'
import JoinScreen from './components/JoinScreen'
import PlayerView from './components/player/PlayerView'
import AdminView from './components/admin/AdminView'

function App() {
  const route = useHashRoute()
  const { joined } = useGameState()

  // Admin skips the join screen entirely
  if (route === 'admin') {
    return <AdminView />
  }

  if (!joined) {
    return <JoinScreen />
  }

  return <PlayerView />
}

export default App
