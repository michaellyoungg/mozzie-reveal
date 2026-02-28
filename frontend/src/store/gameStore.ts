/**
 * IMPORTANT: This file should have NO dependencies except types and zustand/vanilla
 *
 * The store is pure state management with zero dependencies on:
 * - services (websocket, etc.)
 * - actions
 * - React
 *
 * This ensures the store can be used anywhere without circular dependencies
 * and maintains clean separation of concerns.
 *
 * If you need to add logic that depends on services, put it in:
 * - src/actions/gameActions.ts (for game logic)
 * - src/services/websocket.ts (for communication)
 */

import { createStore } from 'zustand/vanilla'
import {
  PlayerInfo,
  GameConfig,
  RoundData,
  GuessData,
  RoundResults,
  Notification
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
}

/**
 * Vanilla Zustand store - pure state with NO dependencies
 * Can be used outside React components
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
}))
