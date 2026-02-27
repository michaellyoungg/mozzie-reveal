import { useGameState } from './hooks/useGameSelectors'
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
  const {
    joined,
    config,
    roundActive,
    roundData,
    hasGuessed,
    results,
    showAdmin,
  } = useGameState()

  // Show join screen immediately - connection happens when user submits name
  if (!joined) {
    return <JoinScreen />
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
      <Notification />

      <Header />

      <div className="grid grid-cols-[1fr_380px] gap-8 lg:grid-cols-1">
        {/* Main content area */}
        <div className="bg-white p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {showAdmin && (
            <AdminPanel />
          )}

          {/* Show slideshow only when not actively guessing */}
          {(!roundActive || results) && (
            <Slideshow />
          )}

          {/* Active round */}
          {roundActive && !hasGuessed && roundData && (
            <div className="my-8">
              <h2 className="text-[#6C5B7B] text-center mb-8 font-bold">{roundData.title}</h2>
              <p className="text-lg text-[#6C5B7B] my-4 mb-8 leading-relaxed text-center">{roundData.question}</p>

              {roundData.type === 'breed_percentage' && (
                <BreedPercentageRound
                  availableBreeds={roundData.available_breeds}
                />
              )}
              {roundData.type === 'numeric_guess' && (
                <NumericGuessRound
                  unit={roundData.unit}
                />
              )}
              {roundData.type === 'multi_select' && (
                <MultiSelectRound
                  options={roundData.options}
                />
              )}
              {roundData.type === 'multiple_choice' && (
                <MultipleChoiceRound
                  options={roundData.options}
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
          <RoundResults />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 lg:order-first">
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

export default App
