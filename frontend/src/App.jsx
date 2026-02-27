import { useState, useEffect, useRef } from 'react'
import './App.css'

const BREEDS = [
  'Golden Retriever',
  'Labrador',
  'German Shepherd',
  'Poodle',
  'Bulldog',
  'Beagle',
  'Husky',
  'Corgi',
  'Dachshund',
  'Shiba Inu',
  'Border Collie',
  'Australian Shepherd'
]

function App() {
  const [connected, setConnected] = useState(false)
  const [joined, setJoined] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [players, setPlayers] = useState([])
  const [roundActive, setRoundActive] = useState(false)
  const [puppyImage, setPuppyImage] = useState(null)
  const [selectedBreed, setSelectedBreed] = useState(null)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [results, setResults] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminImageUrl, setAdminImageUrl] = useState('')
  const [adminCorrectBreed, setAdminCorrectBreed] = useState('')
  const wsRef = useRef(null)

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
          console.log('Welcome! Player ID:', msg.player_id)
          break
        case 'player_joined':
          console.log(`${msg.name} joined (${msg.player_count} players)`)
          break
        case 'game_state':
          setPlayers(msg.players)
          setRoundActive(msg.round_active)
          if (msg.image_url) {
            setPuppyImage(msg.image_url)
          }
          break
        case 'round_started':
          setPuppyImage(msg.image_url)
          setRoundActive(true)
          setHasGuessed(false)
          setSelectedBreed(null)
          setResults(null)
          break
        case 'guess_submitted':
          // Update players to show who has guessed
          setPlayers(prev => prev.map(p =>
            p.name === msg.name ? { ...p, has_guessed: true } : p
          ))
          break
        case 'round_ended':
          setResults({
            correct_breed: msg.correct_breed,
            results: msg.results
          })
          setRoundActive(false)
          // Update scores
          setPlayers(prev => prev.map(p => {
            const result = msg.results.find(r => r.name === p.name)
            return result ? { ...p, score: result.score } : p
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
      wsRef.current.send(JSON.stringify({
        type: 'join',
        name: nameInput.trim()
      }))
      setPlayerName(nameInput.trim())
      setJoined(true)
    }
  }

  const submitGuess = () => {
    if (selectedBreed && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'guess',
        breed: selectedBreed
      }))
      setHasGuessed(true)
    }
  }

  const startRound = () => {
    if (adminImageUrl && adminCorrectBreed && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'start_round',
        image_url: adminImageUrl,
        correct_breed: adminCorrectBreed
      }))
      setAdminImageUrl('')
      setAdminCorrectBreed('')
    }
  }

  const revealAnswer = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'reveal'
      }))
    }
  }

  if (!connected) {
    return (
      <div className="app">
        <h1>Puppy Breed Guessing Game</h1>
        <div className="loading">Connecting to server...</div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="app">
        <h1>Puppy Breed Guessing Game</h1>
        <div className="join-screen">
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
            Join Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Puppy Breed Guessing Game</h1>
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
                <input
                  type="text"
                  placeholder="Image URL"
                  value={adminImageUrl}
                  onChange={(e) => setAdminImageUrl(e.target.value)}
                />
                <select
                  value={adminCorrectBreed}
                  onChange={(e) => setAdminCorrectBreed(e.target.value)}
                >
                  <option value="">Select correct breed</option>
                  {BREEDS.map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
                <button
                  onClick={startRound}
                  disabled={!adminImageUrl || !adminCorrectBreed}
                >
                  Start Round
                </button>
                {roundActive && (
                  <button onClick={revealAnswer}>
                    Reveal Answer
                  </button>
                )}
              </div>
            </div>
          )}

          {puppyImage && (
            <div className="puppy-container">
              <img src={puppyImage} alt="Guess the breed" className="puppy-image" />
            </div>
          )}

          {roundActive && !hasGuessed && (
            <div className="breed-selection">
              <h2>What breed is this puppy?</h2>
              <div className="breeds-grid">
                {BREEDS.map(breed => (
                  <button
                    key={breed}
                    className={`breed-option ${selectedBreed === breed ? 'selected' : ''}`}
                    onClick={() => setSelectedBreed(breed)}
                  >
                    {breed}
                  </button>
                ))}
              </div>
              <button
                className="submit-guess"
                onClick={submitGuess}
                disabled={!selectedBreed}
              >
                Submit Guess
              </button>
            </div>
          )}

          {hasGuessed && roundActive && (
            <div className="waiting">
              <h2>Guess submitted: {selectedBreed}</h2>
              <p>Waiting for other players and reveal...</p>
            </div>
          )}

          {results && (
            <div className="results">
              <h2>Correct Answer: {results.correct_breed}</h2>
              <div className="results-list">
                {results.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`result-item ${result.correct ? 'correct' : 'incorrect'}`}
                  >
                    <span className="result-name">{result.name}</span>
                    <span className="result-guess">guessed: {result.guess}</span>
                    <span className="result-status">
                      {result.correct ? '✓ Correct!' : '✗ Wrong'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!roundActive && !results && puppyImage && (
            <div className="waiting">
              <p>Round ended. Waiting for next round...</p>
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
                  <div key={idx} className="player-card">
                    <span className="player-rank">#{idx + 1}</span>
                    <span className="player-name">
                      {player.name}
                      {player.has_guessed && roundActive && ' ✓'}
                    </span>
                    <span className="player-score">{player.score} pts</span>
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
