import { create } from 'zustand'
import {
  PlayerInfo,
  GameConfig,
  RoundData,
  GuessData,
  RoundResults,
  Notification,
  ServerMessage
} from '../types/game'

interface GameState {
  // Connection state
  connected: boolean
  joined: boolean
  playerName: string
  playerId: string | null

  // Game state
  config: GameConfig | null
  players: PlayerInfo[]
  currentRound: number | null
  roundActive: boolean
  roundData: RoundData | null

  // Player state
  currentGuess: GuessData | null
  hasGuessed: boolean
  results: RoundResults | null

  // UI state
  notification: Notification | null
  showAdmin: boolean

  // WebSocket
  ws: WebSocket | null
}

export const useGameStore = create<GameState>(() => ({
  // Initial state
  connected: false,
  joined: false,
  playerName: '',
  playerId: null,
  config: null,
  players: [],
  currentRound: null,
  roundActive: false,
  roundData: null,
  currentGuess: null,
  hasGuessed: false,
  results: null,
  notification: null,
  showAdmin: false,
  ws: null,
}))

// Actions as plain functions outside the store
export const gameActions = {
  connect: () => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => {
      console.log('Connected to server')
      useGameStore.setState({ connected: true, ws })
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      console.log('Received:', msg)
      gameActions.handleMessage(msg)
    }

    ws.onclose = () => {
      console.log('Disconnected')
      useGameStore.setState({ connected: false, ws: null })
    }

    useGameStore.setState({ ws })
  },

  disconnect: () => {
    const { ws } = useGameStore.getState()
    if (ws) {
      ws.close()
      useGameStore.setState({ ws: null, connected: false })
    }
  },

  joinGame: (name: string) => {
    const { ws, playerId } = useGameStore.getState()
    if (ws && name.trim()) {
      const existingPlayerId = playerId || localStorage.getItem('puppy_game_player_id')
      ws.send(JSON.stringify({
        type: 'join',
        name: name.trim(),
        player_id: existingPlayerId
      }))
      useGameStore.setState({ playerName: name.trim(), joined: true })
    }
  },

  submitGuess: (guess: GuessData) => {
    const { ws } = useGameStore.getState()
    if (ws) {
      ws.send(JSON.stringify({
        type: 'submit_guess',
        guess
      }))
      useGameStore.setState({ hasGuessed: true })
      gameActions.showNotification('Guess submitted!', 'success')
    }
  },

  startRound: () => {
    const { ws } = useGameStore.getState()
    if (ws) {
      ws.send(JSON.stringify({ type: 'start_round' }))
    }
  },

  revealAnswer: () => {
    const { ws } = useGameStore.getState()
    if (ws) {
      ws.send(JSON.stringify({ type: 'reveal' }))
    }
  },

  nextRound: () => {
    const { ws } = useGameStore.getState()
    if (ws) {
      ws.send(JSON.stringify({ type: 'next_round' }))
    }
  },

  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    useGameStore.setState({ notification: { message, type } })
    setTimeout(() => useGameStore.setState({ notification: null }), 3000)
  },

  toggleAdmin: () => {
    useGameStore.setState(state => ({ showAdmin: !state.showAdmin }))
  },

  setCurrentGuess: (guess: GuessData | null) => {
    useGameStore.setState({ currentGuess: guess })
  },

  // Internal message handler
  handleMessage: (msg: ServerMessage) => {
    switch (msg.type) {
      case 'welcome':
        localStorage.setItem('puppy_game_player_id', msg.player_id)
        useGameStore.setState({ playerId: msg.player_id })
        break

      case 'config':
        useGameStore.setState({ config: msg })
        console.log('Game config loaded:', msg)
        break

      case 'player_joined':
        if (msg.reconnected) {
          gameActions.showNotification(`${msg.name} reconnected!`, 'success')
        } else {
          gameActions.showNotification(`${msg.name} joined!`, 'info')
        }
        break

      case 'player_disconnected':
        gameActions.showNotification(`${msg.name} disconnected`, 'warning')
        break

      case 'game_state':
        useGameStore.setState({
          players: msg.players,
          currentRound: msg.current_round,
          roundActive: msg.round_active
        })
        break

      case 'round_started':
        useGameStore.setState({
          roundData: msg.round_data,
          roundActive: true,
          hasGuessed: false,
          currentGuess: null,
          results: null
        })
        gameActions.showNotification(`Round ${msg.round_number} started!`, 'info')
        break

      case 'guess_submitted':
        useGameStore.setState(state => ({
          players: state.players.map(p =>
            p.name === msg.name ? { ...p, has_guessed: true } : p
          )
        }))
        break

      case 'round_ended':
        useGameStore.setState(state => ({
          results: msg,
          roundActive: false,
          players: state.players.map(p => {
            const result = msg.results.find(r => r.name === p.name)
            return result ? { ...p, score: result.total_score } : p
          })
        }))
        break
    }
  }
}
