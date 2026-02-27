import { useState, useEffect, useRef } from 'react'
import './App.css'

// Puppy photos in the public folder
const PUPPY_PHOTOS = [
  '/PXL_20260130_222909317.jpg',
  '/PXL_20260201_195112570.jpg',
  '/PXL_20260206_013619475.jpg',
  '/PXL_20260210_003411072.jpg',
  '/PXL_20260220_234251765.jpg',
  '/PXL_20260221_001100324.jpg'
]

function App() {
  const [connected, setConnected] = useState(false)
  const [joined, setJoined] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState(null)
  const [nameInput, setNameInput] = useState('')

  // Game config
  const [config, setConfig] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentRound, setCurrentRound] = useState(null)
  const [roundActive, setRoundActive] = useState(false)

  // Round data
  const [roundData, setRoundData] = useState(null)

  // Guessing state
  const [currentGuess, setCurrentGuess] = useState(null)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [results, setResults] = useState(null)
  const [notification, setNotification] = useState(null)

  // Round-specific state (lifted to top level)
  const [selectedBreeds, setSelectedBreeds] = useState([])
  const [numericValue, setNumericValue] = useState(50)
  const [multiSelections, setMultiSelections] = useState([])
  const [multipleChoiceSelection, setMultipleChoiceSelection] = useState(null)

  // Admin
  const [showAdmin, setShowAdmin] = useState(false)

  // Slideshow
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const wsRef = useRef(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % PUPPY_PHOTOS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Clear round-specific state when round changes
  useEffect(() => {
    if (roundData) {
      setSelectedBreeds([])
      setNumericValue(50)
      setMultiSelections([])
      setMultipleChoiceSelection(null)
      setCurrentGuess(null)
    }
  }, [roundData])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => {
      console.log('Connected to server')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      console.log('Received:', msg)

      switch (msg.type) {
        case 'welcome':
          localStorage.setItem('puppy_game_player_id', msg.player_id)
          setPlayerId(msg.player_id)
          break
        case 'config':
          setConfig(msg)
          console.log('Game config loaded:', msg)
          break
        case 'player_joined':
          if (msg.reconnected) {
            showNotification(`${msg.name} reconnected!`, 'success')
          } else {
            showNotification(`${msg.name} joined!`, 'info')
          }
          break
        case 'player_disconnected':
          showNotification(`${msg.name} disconnected`, 'warning')
          break
        case 'game_state':
          setPlayers(msg.players)
          setCurrentRound(msg.current_round)
          setRoundActive(msg.round_active)
          break
        case 'round_started':
          setRoundData(msg.round_data)
          setRoundActive(true)
          setHasGuessed(false)
          setCurrentGuess(null)
          setResults(null)
          showNotification(`Round ${msg.round_number} started!`, 'info')
          break
        case 'guess_submitted':
          setPlayers(prev => prev.map(p =>
            p.name === msg.name ? { ...p, has_guessed: true } : p
          ))
          break
        case 'round_ended':
          setResults(msg)
          setRoundActive(false)
          setPlayers(prev => prev.map(p => {
            const result = msg.results.find(r => r.name === p.name)
            return result ? { ...p, score: result.total_score } : p
          }))
          break
      }
    }

    ws.onclose = () => {
      console.log('Disconnected')
      setConnected(false)
    }

    wsRef.current = ws
    return () => ws.close()
  }, [])

  const joinGame = () => {
    if (nameInput.trim() && wsRef.current) {
      const existingPlayerId = localStorage.getItem('puppy_game_player_id')
      wsRef.current.send(JSON.stringify({
        type: 'join',
        name: nameInput.trim(),
        player_id: existingPlayerId
      }))
      setPlayerName(nameInput.trim())
      setJoined(true)
    }
  }

  const submitGuess = () => {
    if (wsRef.current && currentGuess) {
      wsRef.current.send(JSON.stringify({
        type: 'submit_guess',
        guess: currentGuess
      }))
      setHasGuessed(true)
      showNotification('Guess submitted!', 'success')
    }
  }

  const startRound = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'start_round' }))
    }
  }

  const revealAnswer = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'reveal' }))
    }
  }

  const nextRound = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'next_round' }))
    }
  }

  // Breed Percentage UI
  const renderBreedPercentageUI = () => {
    const addBreed = (breedName) => {
      if (!selectedBreeds.find(b => b.name === breedName)) {
        const updated = [...selectedBreeds, { name: breedName, percentage: 10 }]
        setSelectedBreeds(updated)
        setCurrentGuess({ type: 'breed_percentage', guesses: updated })
      }
    }

    const removeBreed = (breedName) => {
      const updated = selectedBreeds.filter(b => b.name !== breedName)
      setSelectedBreeds(updated)
      setCurrentGuess({ type: 'breed_percentage', guesses: updated })
    }

    const updatePercentage = (breedName, percentage) => {
      const updated = selectedBreeds.map(b =>
        b.name === breedName ? { ...b, percentage: Math.max(0, Math.min(100, percentage)) } : b
      )
      setSelectedBreeds(updated)
      setCurrentGuess({ type: 'breed_percentage', guesses: updated })
    }

    const totalPercentage = selectedBreeds.reduce((sum, b) => sum + b.percentage, 0)
    const availableBreeds = roundData.available_breeds.filter(
      b => !selectedBreeds.find(s => s.name === b)
    )

    return (
      <>
        <div className="selected-breeds">
          <h3>Your Guesses ({totalPercentage.toFixed(1)}%)</h3>
          {selectedBreeds.length === 0 ? (
            <p className="hint">Add breeds from the list below</p>
          ) : (
            <div className="guess-list">
              {selectedBreeds.map(breed => (
                <div key={breed.name} className="guess-item">
                  <div className="guess-header">
                    <span className="breed-name">{breed.name}</span>
                    <button
                      className="remove-btn"
                      onClick={() => removeBreed(breed.name)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="percentage-input">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breed.percentage}
                      onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value))}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breed.percentage}
                      onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value) || 0)}
                    />
                    <span>%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="available-breeds">
          <h3>Available Breeds</h3>
          <div className="breeds-grid">
            {availableBreeds.map(breed => (
              <button
                key={breed}
                className="breed-button"
                onClick={() => addBreed(breed)}
              >
                + {breed}
              </button>
            ))}
          </div>
        </div>

        <button
          className="submit-guess"
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
    const handleChange = (newValue) => {
      setNumericValue(newValue)
      setCurrentGuess({ type: 'numeric', value: newValue })
    }

    return (
      <div className="numeric-guess">
        <div className="numeric-input-container">
          <input
            type="number"
            value={numericValue}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="numeric-input"
            min="0"
            step="1"
          />
          <span className="unit">{roundData.unit}</span>
        </div>
        <input
          type="range"
          min="0"
          max="120"
          step="1"
          value={numericValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="numeric-slider"
        />
        <button
          className="submit-guess"
          onClick={submitGuess}
        >
          Submit Guess
        </button>
      </div>
    )
  }

  // Multi Select UI
  const renderMultiSelectUI = () => {
    const toggleSelection = (option) => {
      const updated = multiSelections.includes(option)
        ? multiSelections.filter(s => s !== option)
        : [...multiSelections, option]
      setMultiSelections(updated)
      setCurrentGuess({ type: 'multi_select', selections: updated })
    }

    return (
      <div className="multi-select">
        <div className="options-list">
          {roundData.options.map(option => (
            <label key={option} className="option-item">
              <input
                type="checkbox"
                checked={multiSelections.includes(option)}
                onChange={() => toggleSelection(option)}
              />
              <span className="option-label">{option}</span>
            </label>
          ))}
        </div>
        <button
          className="submit-guess"
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
    const handleSelect = (option) => {
      setMultipleChoiceSelection(option)
      setCurrentGuess({ type: 'multiple_choice', selection: option })
    }

    return (
      <div className="multiple-choice">
        <div className="choice-buttons">
          {roundData.options.map(option => (
            <button
              key={option}
              className={`choice-button ${multipleChoiceSelection === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          className="submit-guess"
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
      <div className="app">
        <h1>Mozzie's Breed Reveal Party!</h1>
        <div className="loading">Connecting to server...</div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="app">
        <h1>Mozzie's Breed Reveal Party!</h1>
        <div className="join-screen">
          <p className="party-subtitle">Welcome to the celebration! Can you guess Mozzie's breed mix?</p>
          <h2>Enter your name to join</h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinGame()}
            placeholder="Your name"
            autoFocus
          />
          <button onClick={joinGame} disabled={!nameInput.trim()}>
            Join the Party!
          </button>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="app">
        <h1>Mozzie's Breed Reveal Party!</h1>
        <div className="loading">Loading game...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="header">
        <h1>{config.title}</h1>
        <div className="round-progress">
          Round {currentRound !== null ? currentRound + 1 : 0} of {config.total_rounds}
        </div>
        <div className="player-info">
          Playing as: <strong>{playerName}</strong>
        </div>
        <button
          className="admin-toggle"
          onClick={() => setShowAdmin(!showAdmin)}
        >
          {showAdmin ? 'Hide' : 'Show'} Admin
        </button>
      </div>

      <div className="game-container">
        <div className="main-area">
          {showAdmin && (
            <div className="admin-panel">
              <h3>Admin Controls</h3>
              <div className="admin-controls">
                {!roundActive && currentRound === null && (
                  <button onClick={startRound}>
                    Start Round 1
                  </button>
                )}
                {roundActive && (
                  <button onClick={revealAnswer}>
                    Reveal Answer
                  </button>
                )}
                {!roundActive && results && currentRound !== null && currentRound < config.total_rounds - 1 && (
                  <button onClick={nextRound}>
                    Next Round
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="puppy-container">
            <div className="slideshow">
              <img
                src={PUPPY_PHOTOS[currentPhotoIndex]}
                alt={config.puppy_name}
                className="puppy-image"
              />
              <div className="slideshow-dots">
                {PUPPY_PHOTOS.map((_, idx) => (
                  <button
                    key={idx}
                    className={`dot ${idx === currentPhotoIndex ? 'active' : ''}`}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            <h2>{config.puppy_name}</h2>
          </div>

          {roundActive && !hasGuessed && roundData && (
            <div className="guessing-area">
              <h2>{roundData.title}</h2>
              <p className="round-question">{roundData.question}</p>

              {roundData.type === 'breed_percentage' && renderBreedPercentageUI()}
              {roundData.type === 'numeric_guess' && renderNumericGuessUI()}
              {roundData.type === 'multi_select' && renderMultiSelectUI()}
              {roundData.type === 'multiple_choice' && renderMultipleChoiceUI()}
            </div>
          )}

          {hasGuessed && roundActive && (
            <div className="waiting">
              <h2>Guess submitted!</h2>
              <p>Waiting for reveal...</p>
            </div>
          )}

          {results && (
            <div className="results">
              <h2>🎉 Round {results.round_number} Results! 🎉</h2>

              <div className="correct-answer">
                <h3>The Answer:</h3>
                <div className="answer-display">
                  {JSON.stringify(results.correct_answer, null, 2)}
                </div>
              </div>

              <div className="results-list">
                <h3>Player Results:</h3>
                {results.results.map((result, idx) => (
                  <div key={idx} className="result-card">
                    <div className="result-header">
                      <span className="result-name">{result.name}</span>
                      <span className="result-points">
                        +{result.points_earned.toFixed(1)} pts (Total: {result.total_score.toFixed(1)})
                      </span>
                    </div>
                    <div className="result-details">
                      {result.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="leaderboard">
            <h3>Leaderboard ({players.length} players)</h3>
            <div className="players-list">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div key={idx} className={`player-card ${!player.online ? 'offline' : ''}`}>
                    <span className="player-rank">#{idx + 1}</span>
                    <span className="player-name">
                      {player.name}
                      {player.has_guessed && roundActive && ' ✓'}
                      {!player.online && ' 💤'}
                    </span>
                    <span className="player-score">{player.score.toFixed(1)} pts</span>
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
