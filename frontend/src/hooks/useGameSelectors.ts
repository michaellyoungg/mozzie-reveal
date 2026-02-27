import { useGameStore } from '../store/gameStore'

/**
 * Hook for accessing game state
 */
export function useGameState() {
  return useGameStore(state => ({
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
}

/**
 * Hook for accessing game actions
 */
export function useGameActions() {
  return useGameStore(state => ({
    connect: state.connect,
    disconnect: state.disconnect,
    joinGame: state.joinGame,
    submitGuess: state.submitGuess,
    startRound: state.startRound,
    revealAnswer: state.revealAnswer,
    nextRound: state.nextRound,
    toggleAdmin: state.toggleAdmin,
  }))
}
