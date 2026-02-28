import { useGameState } from '../../hooks/useGameSelectors'
import Header from '../Header'
import Notification from '../Notification'
import Slideshow from '../Slideshow'
import Leaderboard from '../Leaderboard'
import RoundResults from '../RoundResults'
import GameOver from '../GameOver'
import PlayerRound from './PlayerRound'

export default function PlayerView() {
  const { config, currentRound, roundActive, results } = useGameState()
  const isGameOver = !roundActive && results !== null && config !== null && currentRound !== null && currentRound >= config.total_rounds - 1

  if (!config) {
    return (
      <div className="px-3 pt-2 pb-4 md:max-w-2xl md:mx-auto md:px-6 md:py-6">
        <h1 className="m-0 bg-linear-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-xl md:text-2xl font-bold tracking-tight text-center">
          Mozzie's Breed Reveal Party!
        </h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">
          Loading game...
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pt-2 pb-4 md:max-w-2xl md:mx-auto md:px-6 md:py-6">
      <Notification />
      <Header />

      <div className="flex flex-col gap-3 md:gap-4">
        {/* Game Over screen */}
        {isGameOver && <GameOver />}

        {/* Main content card (non-game-over states) */}
        {!isGameOver && (
          <div className="bg-white p-3 md:p-6 rounded-2xl shadow-lg">
            {/* Lobby: show slideshow when no round active and no results */}
            {!roundActive && !results && (
              <>
                <div className="text-center py-6 animate-pulse">
                  <p className="text-base md:text-lg text-[#6C5B7B] font-semibold">Waiting for host to start...</p>
                </div>
                <Slideshow />
              </>
            )}

            {/* Active round: question + answer UI only */}
            {roundActive && <PlayerRound />}

            {/* Results (mid-game) */}
            {results && <RoundResults />}
          </div>
        )}

        {/* Leaderboard: only visible on mid-game results */}
        {results && !isGameOver && <Leaderboard />}
      </div>
    </div>
  )
}
