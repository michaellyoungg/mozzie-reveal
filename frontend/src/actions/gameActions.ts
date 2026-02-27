import { gameStore } from '../store/gameStore'
import { websocketService } from '../services/websocket'
import { GuessData } from '../types/game'

/**
 * Game actions - business logic for game operations
 * Uses websocket service for communication
 * Uses vanilla store so can be called from anywhere (not just React components)
 *
 * Note: WebSocket connection is managed by websocketService, not here
 */
export const gameActions = {
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
