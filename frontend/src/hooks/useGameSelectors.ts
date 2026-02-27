import { useGameStore } from '../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

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
      showAdmin: state.showAdmin,
    }))
  )
}

/**
 * Hook for accessing game actions
 * Uses shallow comparison to prevent unnecessary re-renders
 */
export function useGameActions() {
  return useGameStore(
    useShallow(state => ({
      connect: state.connect,
      disconnect: state.disconnect,
      joinGame: state.joinGame,
      submitGuess: state.submitGuess,
      startRound: state.startRound,
      revealAnswer: state.revealAnswer,
      nextRound: state.nextRound,
      toggleAdmin: state.toggleAdmin,
    }))
  )
}
