import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { gameStore } from '../store/gameStore'
import { gameActions } from '../actions/gameActions'

/**
 * React hook wrapper for vanilla Zustand store
 * This allows React components to subscribe to store changes
 */
export const useGameStore = <T,>(selector: (state: ReturnType<typeof gameStore.getState>) => T) =>
  useStore(gameStore, selector)

/**
 * Hook for accessing game state
 * Uses shallow comparison to prevent unnecessary re-renders
 */
export function useGameState() {
  return useGameStore(
    useShallow(state => ({
      connected: state.connected,
      joined: state.joined,
      playerName: state.playerName,
      config: state.config,
      players: state.players,
      currentRound: state.currentRound,
      roundActive: state.roundActive,
      roundData: state.roundData,
      hasGuessed: state.hasGuessed,
      results: state.results,
      notification: state.notification,
    }))
  )
}

/**
 * Re-export game actions
 * These are stable function references and don't need hooks
 */
export { gameActions }
