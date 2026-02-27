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

  // Actions
  connect: () => void
  disconnect: () => void
  joinGame: (name: string) => void
  submitGuess: (guess: GuessData) => void
  startRound: () => void
  revealAnswer: () => void
  nextRound: () => void
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  toggleAdmin: () => void
  setCurrentGuess: (guess: GuessData | null) => void

  // Internal message handler
  handleMessage: (msg: ServerMessage) => void
}

export const useGameStore = create<GameState>((set, get) => ({
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

  // Actions
  connect: () => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => {
      console.log('Connected to server')
      set({ connected: true, ws })
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      console.log('Received:', msg)
      get().handleMessage(msg)
    }

    ws.onclose = () => {
      console.log('Disconnected')
      set({ connected: false, ws: null })
    }

    set({ ws })
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
      set({ ws: null, connected: false })
    }
  },

  joinGame: (name: string) => {
    const { ws, playerId } = get()
    if (ws && name.trim()) {
      const existingPlayerId = playerId || localStorage.getItem('puppy_game_player_id')
      ws.send(JSON.stringify({
        type: 'join',
        name: name.trim(),
        player_id: existingPlayerId
      }))
      set({ playerName: name.trim(), joined: true })
    }
  },

  submitGuess: (guess: GuessData) => {
    const { ws } = get()
    if (ws) {
      ws.send(JSON.stringify({
        type: 'submit_guess',
        guess
      }))
      set({ hasGuessed: true })
      get().showNotification('Guess submitted!', 'success')
    }
  },

  startRound: () => {
    const { ws } = get()
    if (ws) {
      ws.send(JSON.stringify({ type: 'start_round' }))
    }
  },

  revealAnswer: () => {
    const { ws } = get()
    if (ws) {
      ws.send(JSON.stringify({ type: 'reveal' }))
    }
  },

  nextRound: () => {
    const { ws } = get()
    if (ws) {
      ws.send(JSON.stringify({ type: 'next_round' }))
    }
  },

  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    set({ notification: { message, type } })
    setTimeout(() => set({ notification: null }), 3000)
  },

  toggleAdmin: () => {
    set(state => ({ showAdmin: !state.showAdmin }))
  },

  setCurrentGuess: (guess: GuessData | null) => {
    set({ currentGuess: guess })
  },

  // Internal message handler
  handleMessage: (msg: ServerMessage) => {
    switch (msg.type) {
      case 'welcome':
        localStorage.setItem('puppy_game_player_id', msg.player_id)
        set({ playerId: msg.player_id })
        break

      case 'config':
        set({ config: msg })
        console.log('Game config loaded:', msg)
        break

      case 'player_joined':
        if (msg.reconnected) {
          get().showNotification(`${msg.name} reconnected!`, 'success')
        } else {
          get().showNotification(`${msg.name} joined!`, 'info')
        }
        break

      case 'player_disconnected':
        get().showNotification(`${msg.name} disconnected`, 'warning')
        break

      case 'game_state':
        set({
          players: msg.players,
          currentRound: msg.current_round,
          roundActive: msg.round_active
        })
        break

      case 'round_started':
        set({
          roundData: msg.round_data,
          roundActive: true,
          hasGuessed: false,
          currentGuess: null,
          results: null
        })
        get().showNotification(`Round ${msg.round_number} started!`, 'info')
        break

      case 'guess_submitted':
        set(state => ({
          players: state.players.map(p =>
            p.name === msg.name ? { ...p, has_guessed: true } : p
          )
        }))
        break

      case 'round_ended':
        set(state => ({
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
}))
