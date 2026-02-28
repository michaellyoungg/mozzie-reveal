import { useEffect } from 'react'
import { useGameState, gameActions } from '../../hooks/useGameSelectors'
import Header from '../Header'
import Notification from '../Notification'
import Leaderboard from '../Leaderboard'
import GameOver from '../GameOver'
import AdminLobby from './AdminLobby'
import AdminRoundControl from './AdminRoundControl'
import AdminResults from './AdminResults'

export default function AdminView() {
  const { config, connected, roundActive, currentRound, results } = useGameState()

  useEffect(() => {
    if (!connected) {
      gameActions.connectAdmin()
    }
  }, [])

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-2 pb-4 md:px-6 md:py-6">
        <h1 className="m-0 bg-linear-to-br from-bubble to-bubble-deep bg-clip-text text-transparent text-xl md:text-2xl font-bold tracking-tight text-center">
          Host Dashboard
        </h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">
          Loading game...
        </div>
      </div>
    )
  }

  // Determine which admin screen to show
  const isGameOver = !roundActive && results !== null && currentRound !== null && currentRound >= config.total_rounds - 1
  const isLobby = !roundActive && currentRound === null
  const isActiveRound = roundActive
  const isResults = !roundActive && results !== null && !isGameOver

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-4 md:px-6 md:py-6">
      <Notification />
      <Header isAdmin />

      <div className="flex flex-col gap-4 md:gap-5">
        {/* Game Over screen replaces everything */}
        {isGameOver && <GameOver />}

        {/* Main content card (non-game-over states) */}
        {!isGameOver && (
          <div className="bg-white/95 backdrop-blur-sm p-3 md:p-6 rounded-2xl shadow-lg">
            {isLobby && <AdminLobby />}
            {isActiveRound && <AdminRoundControl />}
            {isResults && <AdminResults />}
          </div>
        )}

        {/* Leaderboard visible for admin except during game over (shown inside GameOver) */}
        {!isGameOver && <Leaderboard />}

        {/* Reset button - always available */}
        <button
          onClick={gameActions.resetGame}
          className="w-full min-h-[44px] py-3 px-6 text-sm font-semibold text-gray-500 bg-transparent border-2 border-gray-300 rounded-xl cursor-pointer transition-all duration-300 active:scale-95 md:hover:border-red-400 md:hover:text-red-500"
        >
          Reset Game
        </button>
      </div>
    </div>
  )
}
