import { useState, useEffect } from 'react'
import Slideshow from './components/Slideshow'
import AdminPanel from './components/AdminPanel'
import { useGameStore } from './store/gameStore'
import { BreedGuess, GuessData } from './types/game'

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
  const submitGuessToStore = useGameStore(state => state.submitGuess)
  const startRound = useGameStore(state => state.startRound)
  const revealAnswer = useGameStore(state => state.revealAnswer)
  const nextRound = useGameStore(state => state.nextRound)
  const toggleAdmin = useGameStore(state => state.toggleAdmin)
  const setCurrentGuess = useGameStore(state => state.setCurrentGuess)

  // Local UI state (truly local to components/rounds)
  const [nameInput, setNameInput] = useState<string>('')
  const [selectedBreeds, setSelectedBreeds] = useState<BreedGuess[]>([])
  const [numericValue, setNumericValue] = useState<number>(50)
  const [multiSelections, setMultiSelections] = useState<string[]>([])
  const [multipleChoiceSelection, setMultipleChoiceSelection] = useState<string | null>(null)

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Clear round-specific state when round changes
  useEffect(() => {
    if (roundData) {
      setSelectedBreeds([])
      setNumericValue(50)
      setMultiSelections([])
      setMultipleChoiceSelection(null)
      setCurrentGuess(null)
    }
  }, [roundData, setCurrentGuess])

  const handleJoinGame = () => {
    if (nameInput.trim()) {
      joinGame(nameInput.trim())
    }
  }

  const submitGuess = () => {
    const { currentGuess } = useGameStore.getState()
    if (currentGuess) {
      submitGuessToStore(currentGuess)
    }
  }

  // Breed Percentage UI
  const renderBreedPercentageUI = () => {
    const addBreed = (breedName: string) => {
      if (!selectedBreeds.find(b => b.name === breedName)) {
        const updated = [...selectedBreeds, { name: breedName, percentage: 10 }]
        setSelectedBreeds(updated)
        setCurrentGuess({ type: 'breed_percentage', guesses: updated })
      }
    }

    const removeBreed = (breedName: string) => {
      const updated = selectedBreeds.filter(b => b.name !== breedName)
      setSelectedBreeds(updated)
      setCurrentGuess({ type: 'breed_percentage', guesses: updated })
    }

    const updatePercentage = (breedName: string, percentage: number) => {
      const updated = selectedBreeds.map(b =>
        b.name === breedName ? { ...b, percentage: Math.max(0, Math.min(100, percentage)) } : b
      )
      setSelectedBreeds(updated)
      setCurrentGuess({ type: 'breed_percentage', guesses: updated })
    }

    if (roundData?.type !== 'breed_percentage') return null

    const totalPercentage = selectedBreeds.reduce((sum, b) => sum + b.percentage, 0)
    const availableBreeds = roundData.available_breeds.filter(
      b => !selectedBreeds.find(s => s.name === b)
    )

    return (
      <>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-[3px] border-blue-500 rounded-[20px] p-6 mb-8">
          <h3 className="m-0 mb-4 text-blue-900 font-bold">Your Guesses ({totalPercentage.toFixed(1)}%)</h3>
          {selectedBreeds.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8 font-medium">Add breeds from the list below</p>
          ) : (
            <div className="flex flex-col gap-4">
              {selectedBreeds.map(breed => (
                <div key={breed.name} className="bg-white border-[3px] border-blue-500 rounded-2xl p-5 transition-all duration-300 animate-[slideInLeft_0.3s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(59,130,246,0.2)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-blue-950 text-lg">{breed.name}</span>
                    <button
                      className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-full w-9 h-9 text-2xl leading-none cursor-pointer transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:scale-125 hover:rotate-90 hover:shadow-[0_6px_18px_rgba(239,68,68,0.4)]"
                      onClick={() => removeBreed(breed.name)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breed.percentage}
                      onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value))}
                      className="w-full h-2 rounded bg-gradient-to-r from-blue-500 to-blue-400 outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(59,130,246,0.5)] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-120"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breed.percentage}
                      onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value) || 0)}
                      className="w-20 p-3 border-[3px] border-blue-100 rounded-xl text-lg font-bold text-center font-fredoka text-blue-900"
                    />
                    <span className="font-bold text-blue-500 text-xl">%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="my-8">
          <h3 className="text-[#6C5B7B] mb-5 font-bold">Available Breeds</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {availableBreeds.map(breed => (
              <button
                key={breed}
                className="py-5 px-4 bg-gradient-to-br from-gray-100 to-gray-200 border-[3px] border-transparent rounded-2xl text-base font-semibold cursor-pointer transition-all duration-300 text-center text-gray-700 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:border-green-700 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
                onClick={() => addBreed(breed)}
              >
                + {breed}
              </button>
            ))}
          </div>
        </div>

        <button
          className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 mt-8 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          onClick={submitGuess}
          disabled={selectedBreeds.length === 0}
        >
          Submit Guesses
        </button>
      </>
    )
  }

  // Numeric Guess UI
  const renderNumericGuessUI = () => {
    const handleChange = (newValue: number) => {
      setNumericValue(newValue)
      setCurrentGuess({ type: 'numeric', value: newValue })
    }

    if (roundData?.type !== 'numeric_guess') return null

    return (
      <div className="flex flex-col gap-8 max-w-[500px] mx-auto">
        <div className="flex items-center justify-center gap-4 bg-gradient-to-br from-pink-100 to-purple-100 p-8 rounded-[20px] shadow-[0_4px_16px_rgba(108,91,123,0.15)]">
          <input
            type="number"
            value={numericValue}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="text-5xl font-bold w-[120px] text-center p-2 border-[3px] border-party-pink rounded-2xl bg-white text-[#6C5B7B] font-fredoka focus:outline-none focus:border-party-purple focus:shadow-[0_0_0_4px_rgba(255,107,157,0.2)]"
            min="0"
            step="1"
          />
          <span className="text-[2rem] font-bold text-party-purple">{roundData.unit}</span>
        </div>
        <input
          type="range"
          min="0"
          max="120"
          step="1"
          value={numericValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="w-full h-3 rounded-[10px] bg-gradient-to-r from-pink-100 to-party-purple outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-party-pink [&::-webkit-slider-thumb]:to-party-purple [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(255,107,157,0.4)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-120 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(255,107,157,0.6)]"
        />
        <button
          className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]"
          onClick={submitGuess}
        >
          Submit Guess
        </button>
      </div>
    )
  }

  // Multi Select UI
  const renderMultiSelectUI = () => {
    const toggleSelection = (option: string) => {
      const updated = multiSelections.includes(option)
        ? multiSelections.filter(s => s !== option)
        : [...multiSelections, option]
      setMultiSelections(updated)
      setCurrentGuess({ type: 'multi_select', selections: updated })
    }

    if (roundData?.type !== 'multi_select') return null

    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          {roundData.options.map(option => (
            <label key={option} className="flex items-center gap-4 py-5 px-6 bg-white border-[3px] border-transparent rounded-2xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] select-none hover:border-pink-100 hover:translate-x-1">
              <input
                type="checkbox"
                checked={multiSelections.includes(option)}
                onChange={() => toggleSelection(option)}
                className="w-7 h-7 cursor-pointer rounded-lg border-[3px] border-party-purple appearance-none relative bg-white transition-all duration-200 checked:bg-gradient-to-br checked:from-party-pink checked:to-party-purple checked:border-party-pink checked:after:content-['✓'] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-white checked:after:text-xl checked:after:font-bold"
              />
              <span className="text-lg font-semibold text-[#6C5B7B] flex-1">{option}</span>
            </label>
          ))}
        </div>
        <button
          className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          onClick={submitGuess}
          disabled={multiSelections.length === 0}
        >
          Submit Selections
        </button>
      </div>
    )
  }

  // Multiple Choice UI
  const renderMultipleChoiceUI = () => {
    const handleSelect = (option: string) => {
      setMultipleChoiceSelection(option)
      setCurrentGuess({ type: 'multiple_choice', selection: option })
    }

    if (roundData?.type !== 'multiple_choice') return null

    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          {roundData.options.map(option => (
            <button
              key={option}
              className={`py-6 px-8 text-lg font-semibold text-[#6C5B7B] bg-white border-[3px] border-transparent rounded-2xl cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-left font-fredoka hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,157,0.25)] hover:border-pink-100 ${
                multipleChoiceSelection === option
                  ? 'bg-gradient-to-br from-party-pink to-party-purple text-white border-party-pink scale-[1.02] shadow-[0_8px_24px_rgba(255,107,157,0.4)] hover:scale-[1.02] hover:-translate-y-0.5'
                  : ''
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          onClick={submitGuess}
          disabled={!multipleChoiceSelection}
        >
          Submit Answer
        </button>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">Mozzie's Breed Reveal Party!</h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">Connecting to server...</div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">Mozzie's Breed Reveal Party!</h1>
        <div className="bg-white p-12 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[500px] mx-auto my-16 text-center animate-[popIn_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
          <p className="text-lg text-[#6C5B7B] mb-6 font-medium leading-relaxed">Welcome to the celebration! Can you guess Mozzie's breed mix?</p>
          <h2 className="text-[#6C5B7B] mb-6 font-bold">Enter your name to join</h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            placeholder="Your name"
            autoFocus
            className="w-full p-5 text-lg border-[3px] border-gray-200 rounded-2xl mb-4 font-fredoka transition-all duration-300 focus:outline-none focus:border-party-pink focus:shadow-[0_0_0_4px_rgba(255,107,157,0.1)]"
          />
          <button
            onClick={handleJoinGame}
            disabled={!nameInput.trim()}
            className="w-full p-5 text-xl font-bold bg-gradient-to-br from-party-pink to-party-purple text-white border-none rounded-2xl cursor-pointer transition-all duration-300 shadow-[0_6px_20px_rgba(255,107,157,0.3)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(255,107,157,0.4)] disabled:bg-gray-200 disabled:cursor-not-allowed disabled:transform-none"
          >
            Join the Party!
          </button>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">Mozzie's Breed Reveal Party!</h1>
        <div className="text-center py-12 text-white text-2xl font-semibold animate-pulse">Loading game...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {notification && (
        <div className={`fixed top-8 right-8 py-4 px-6 rounded-2xl font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.15)] animate-[slideInBounce_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)] z-[1000] ${
          notification.type === 'info' ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' :
          notification.type === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' :
          notification.type === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
          'bg-gradient-to-br from-red-500 to-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-8 bg-white py-6 px-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">{config.title}</h1>
        <div className="text-base font-semibold text-[#6C5B7B] bg-gradient-to-br from-pink-100 to-purple-100 py-3 px-6 rounded-xl shadow-[0_2px_8px_rgba(108,91,123,0.1)]">
          Round {currentRound !== null ? currentRound + 1 : 0} of {config.total_rounds}
        </div>
        <div className="text-lg text-[#6C5B7B] font-semibold flex items-center gap-2">
          Playing as: <strong>{playerName}</strong>
        </div>
        <button
          className="py-3 px-6 bg-gradient-to-br from-[#FFA500] to-[#FF8C00] text-white border-none rounded-2xl font-bold text-[0.95rem] cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(255,165,0,0.3)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,165,0,0.4)]"
          onClick={toggleAdmin}
        >
          {showAdmin ? 'Hide' : 'Show'} Admin
        </button>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-8 lg:grid-cols-1">
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

          {roundActive && !hasGuessed && roundData && (
            <div className="my-8">
              <h2 className="text-[#6C5B7B] text-center mb-8 font-bold">{roundData.title}</h2>
              <p className="text-lg text-[#6C5B7B] my-4 mb-8 leading-relaxed text-center">{roundData.question}</p>

              {roundData.type === 'breed_percentage' && renderBreedPercentageUI()}
              {roundData.type === 'numeric_guess' && renderNumericGuessUI()}
              {roundData.type === 'multi_select' && renderMultiSelectUI()}
              {roundData.type === 'multiple_choice' && renderMultipleChoiceUI()}
            </div>
          )}

          {hasGuessed && roundActive && (
            <div className="text-center py-12 animate-[fadeIn_0.5s]">
              <h2 className="text-[#6C5B7B] mb-4 font-bold">Guess submitted!</h2>
              <p>Waiting for reveal...</p>
            </div>
          )}

          {results && (
            <div className="my-8 animate-[fadeIn_0.5s]">
              <h2 className="text-[#6C5B7B] text-center mb-8 font-bold text-[2rem]">🎉 Round {results.round_number} Results! 🎉</h2>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-[20px] mb-8 shadow-[0_4px_16px_rgba(76,175,80,0.2)]">
                <h3 className="m-0 mb-4 text-green-800 text-xl">The Answer:</h3>
                <div className="bg-white p-6 rounded-xl font-mono text-sm text-green-800 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                  {JSON.stringify(results.correct_answer, null, 2)}
                </div>
              </div>

              <div>
                <h3 className="text-[#6C5B7B] mb-6 font-bold">Player Results:</h3>
                {results.results.map((result, idx) => (
                  <div key={idx} className="bg-white border-[3px] border-gray-200 rounded-[20px] p-6 mb-5 transition-all duration-300 animate-[slideInLeft_0.3s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-5 pb-5 border-b-2 border-gray-200">
                      <span className="text-xl font-bold text-[#6C5B7B]">{result.name}</span>
                      <span className="text-lg font-bold text-green-500 bg-gradient-to-br from-green-100 to-green-200 py-2 px-4 rounded-xl">
                        +{result.points_earned.toFixed(1)} pts (Total: {result.total_score.toFixed(1)})
                      </span>
                    </div>
                    <div>
                      {result.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:order-first">
          <div className="bg-white p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <h3 className="m-0 mb-6 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-2xl font-bold text-center">Leaderboard ({players.length} players)</h3>
            <div className="flex flex-col gap-3">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div key={idx} className={`flex items-center gap-3.5 py-4 px-5 bg-gradient-to-br from-gray-50 to-gray-100 border-[3px] border-gray-200 rounded-2xl transition-all duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                    !player.online ? 'opacity-50 border-dashed' : ''
                  } ${
                    idx === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-500 font-bold shadow-[0_4px_16px_rgba(245,158,11,0.3)]' : ''
                  } ${
                    idx === 1 ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500' : ''
                  } ${
                    idx === 2 ? 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-500' : ''
                  }`}>
                    <span className="font-bold bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent min-w-[35px] text-lg">#{idx + 1}</span>
                    <span className="flex-1 font-semibold text-gray-700">
                      {player.name}
                      {player.has_guessed && roundActive && ' ✓'}
                      {!player.online && ' 💤'}
                    </span>
                    <span className="font-bold text-green-500 text-lg">{player.score.toFixed(1)} pts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
