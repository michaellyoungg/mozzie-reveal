import { useGameStore } from '../store/gameStore'
import { ServerMessage } from '../types/game'

let ws: WebSocket | null = null

/**
 * WebSocket service for game communication
 * Manages connection and message handling separately from game logic
 */
export const websocketService = {
  /**
   * Establish WebSocket connection to game server
   */
  connect: () => {
    ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => {
      console.log('Connected to server')
      useGameStore.setState({ connected: true, ws })
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      console.log('Received:', msg)
      websocketService.handleMessage(msg)
    }

    ws.onclose = () => {
      console.log('Disconnected from server')
      useGameStore.setState({ connected: false, ws: null })
      ws = null
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    useGameStore.setState({ ws })
  },

  /**
   * Close WebSocket connection
   */
  disconnect: () => {
    if (ws) {
      ws.close()
      ws = null
      useGameStore.setState({ ws: null, connected: false })
    }
  },

  /**
   * Send message to server
   */
  send: (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message:', message)
    }
  },

  /**
   * Handle incoming server messages
   * Updates store state based on message type
   */
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
        {
          const message = msg.reconnected
            ? `${msg.name} reconnected!`
            : `${msg.name} joined!`
          const type = msg.reconnected ? 'success' : 'info'
          websocketService.showNotification(message, type)
        }
        break

      case 'player_disconnected':
        websocketService.showNotification(`${msg.name} disconnected`, 'warning')
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
        websocketService.showNotification(`Round ${msg.round_number} started!`, 'info')
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

      default:
        console.warn('Unknown message type:', msg)
    }
  },

  /**
   * Show notification to user
   */
  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    useGameStore.setState({ notification: { message, type } })
    setTimeout(() => useGameStore.setState({ notification: null }), 3000)
  }
}
