import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import Slideshow from './components/Slideshow'
import AdminPanel from './components/AdminPanel'
import Header from './components/Header'
import JoinScreen from './components/JoinScreen'
import Notification from './components/Notification'
import Leaderboard from './components/Leaderboard'
import RoundResults from './components/RoundResults'
import BreedPercentageRound from './components/rounds/BreedPercentageRound'
import NumericGuessRound from './components/rounds/NumericGuessRound'
import MultiSelectRound from './components/rounds/MultiSelectRound'
import MultipleChoiceRound from './components/rounds/MultipleChoiceRound'

function App() {
  // Global state from Zustand store
  const connected = useGameStore(state => state.connected)
  const joined = useGameStore(state => state.joined)
  const playerName = useGameStore(state => state.playerName)
  const config = useGameStore(state => state.config)
  const players = useGameStore(state => state.players)
  const currentRound = useGameStore(state => state.currentRound)
  const roundActive = useGameStore(state => state.roundActive)
  const roundData = useGameStore(state => state.roundData)
  const hasGuessed = useGameStore(state => state.hasGuessed)
  const results = useGameStore(state => state.results)
  const notification = useGameStore(state => state.notification)
  const showAdmin = useGameStore(state => state.showAdmin)

  // Store actions
  const connect = useGameStore(state => state.connect)
  const disconnect = useGameStore(state => state.disconnect)
  const joinGame = useGameStore(state => state.joinGame)
  const submitGuess = useGameStore(state => state.submitGuess)
  const startRound = useGameStore(state => state.startRound)
  const revealAnswer = useGameStore(state => state.revealAnswer)
  const nextRound = useGameStore(state => state.nextRound)
  const toggleAdmin = useGameStore(state => state.toggleAdmin)

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Handle round submissions
  const handleBreedPercentageSubmit = (guesses: any) => {
    submitGuess({ type: 'breed_percentage', guesses })
  }

  const handleNumericSubmit = (value: number) => {
    submitGuess({ type: 'numeric', value })
  }

  const handleMultiSelectSubmit = (selections: string[]) => {
    submitGuess({ type: 'multi_select', selections })
  }

  const handleMultipleChoiceSubmit = (selection: string) => {
    submitGuess({ type: 'multiple_choice', selection })
  }

  // Loading states
  if (!connected) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">
          Mozzie's Breed Reveal Party!
        </h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">
          Connecting to server...
        </div>
      </div>
    )
  }

  if (!joined) {
    return <JoinScreen onJoin={joinGame} />
  }

  if (!config) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">
          Mozzie's Breed Reveal Party!
        </h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">
          Loading game...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {notification && <Notification notification={notification} />}

      <Header
        title={config.title}
        currentRound={currentRound}
        totalRounds={config.total_rounds}
        playerName={playerName}
        showAdmin={showAdmin}
        onToggleAdmin={toggleAdmin}
      />

      <div className="grid grid-cols-[1fr_380px] gap-8 lg:grid-cols-1">
        {/* Main content area */}
        <div className="bg-white p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {showAdmin && (
            <AdminPanel
              players={players}
              roundActive={roundActive}
              currentRound={currentRound}
              results={results}
              totalRounds={config.total_rounds}
              onStartRound={startRound}
              onRevealAnswer={revealAnswer}
              onNextRound={nextRound}
            />
          )}

          {/* Show slideshow only when not actively guessing */}
          {(!roundActive || results) && (
            <Slideshow puppyName={config.puppy_name} />
          )}

          {/* Active round */}
          {roundActive && !hasGuessed && roundData && (
            <div className="my-8">
              <h2 className="text-[#6C5B7B] text-center mb-8 font-bold">{roundData.title}</h2>
              <p className="text-lg text-[#6C5B7B] my-4 mb-8 leading-relaxed text-center">{roundData.question}</p>

              {roundData.type === 'breed_percentage' && (
                <BreedPercentageRound
                  availableBreeds={roundData.available_breeds}
                  onSubmit={handleBreedPercentageSubmit}
                />
              )}
              {roundData.type === 'numeric_guess' && (
                <NumericGuessRound
                  unit={roundData.unit}
                  onSubmit={handleNumericSubmit}
                />
              )}
              {roundData.type === 'multi_select' && (
                <MultiSelectRound
                  options={roundData.options}
                  onSubmit={handleMultiSelectSubmit}
                />
              )}
              {roundData.type === 'multiple_choice' && (
                <MultipleChoiceRound
                  options={roundData.options}
                  onSubmit={handleMultipleChoiceSubmit}
                />
              )}
            </div>
          )}

          {/* Waiting for reveal */}
          {hasGuessed && roundActive && (
            <div className="text-center py-12 animate-[fadeIn_0.5s]">
              <h2 className="text-[#6C5B7B] mb-4 font-bold">Guess submitted!</h2>
              <p>Waiting for reveal...</p>
            </div>
          )}

          {/* Round results */}
          {results && <RoundResults results={results} />}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 lg:order-first">
          <Leaderboard players={players} roundActive={roundActive} />
        </div>
      </div>
    </div>
  )
}

export default App
