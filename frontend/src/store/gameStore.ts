import { createStore } from 'zustand/vanilla'
import {
  PlayerInfo,
  GameConfig,
  RoundData,
  GuessData,
  RoundResults,
  Notification
} from '../types/game'
import { websocketService } from '../services/websocket'

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

  // WebSocket (managed by websocket service)
  ws: WebSocket | null
}

/**
 * Vanilla Zustand store - can be used outside React components
 */
export const gameStore = createStore<GameState>(() => ({
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

/**
 * Game actions - business logic for game operations
 * Uses websocket service for communication
 * Uses vanilla store so can be called from anywhere (not just React components)
 */
export const gameActions = {
  /**
   * Connect to game server
   */
  connect: () => {
    websocketService.connect()
  },

  /**
   * Disconnect from game server
   */
  disconnect: () => {
    websocketService.disconnect()
  },

  /**
   * Join game with player name
   */
  joinGame: (name: string) => {
    const { playerId } = gameStore.getState()
    if (name.trim()) {
      const existingPlayerId = playerId || localStorage.getItem('puppy_game_player_id')
      websocketService.send({
        type: 'join',
        name: name.trim(),
        player_id: existingPlayerId
      })
      gameStore.setState({ playerName: name.trim(), joined: true })
    }
  },

  /**
   * Submit player's guess for current round
   */
  submitGuess: (guess: GuessData) => {
    websocketService.send({
      type: 'submit_guess',
      guess
    })
    gameStore.setState({ hasGuessed: true })
    websocketService.showNotification('Guess submitted!', 'success')
  },

  /**
   * Start a new round (admin action)
   */
  startRound: () => {
    websocketService.send({ type: 'start_round' })
  },

  /**
   * Reveal answer for current round (admin action)
   */
  revealAnswer: () => {
    websocketService.send({ type: 'reveal' })
  },

  /**
   * Move to next round (admin action)
   */
  nextRound: () => {
    websocketService.send({ type: 'next_round' })
  },

  /**
   * Toggle admin panel visibility
   */
  toggleAdmin: () => {
    gameStore.setState(state => ({ showAdmin: !state.showAdmin }))
  },
}
