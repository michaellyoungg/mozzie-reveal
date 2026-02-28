import { gameStore } from '../store/gameStore'
import { ServerMessage, ClientMessage } from '../types/game'

let ws: WebSocket | null = null
let messageQueue: ClientMessage[] = []

/**
 * WebSocket service for game communication
 * Manages connection and message handling separately from game logic
 *
 * WebSocket instance is kept as module-level variable (infrastructure, not state)
 */
export const websocketService = {
  /**
   * Establish WebSocket connection to game server
   * Prevents duplicate connections
   */
  connect: () => {
    // Don't create a new connection if one already exists and is open/connecting
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting, skipping')
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    console.log('Creating new WebSocket connection to', wsUrl)
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('Connected to server')
      gameStore.setState({ connected: true })

      // Flush queued messages
      if (messageQueue.length > 0) {
        console.log(`Flushing ${messageQueue.length} queued messages`)
        messageQueue.forEach(msg => ws?.send(JSON.stringify(msg)))
        messageQueue = []
      }
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      console.log('Received:', msg)
      websocketService.handleMessage(msg)
    }

    ws.onclose = () => {
      console.log('Disconnected from server')
      gameStore.setState({ connected: false })
      ws = null
      // Clear queue on disconnect - messages would be stale
      messageQueue = []
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      // Clear queue on error
      messageQueue = []
    }
  },

  /**
   * Close WebSocket connection
   */
  disconnect: () => {
    if (ws) {
      console.log('Closing WebSocket connection')
      ws.close()
      ws = null
      gameStore.setState({ connected: false })
    }
  },

  /**
   * Send message to server
   * Queues messages if WebSocket is not ready yet
   */
  send: (message: ClientMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      // Queue message - will be sent when connection opens
      console.log('WebSocket connecting, queueing message:', message.type)
      messageQueue.push(message)
    } else {
      const state = ws
        ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState]
        : 'NOT_CREATED'
      console.warn(`WebSocket not ready (state: ${state}), dropping message:`, message)
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
        gameStore.setState({ playerId: msg.player_id })
        break

      case 'config':
        gameStore.setState({ config: msg })
        console.log('Game config loaded:', msg)
        break

      case 'player_joined':
        {
          gameStore.setState(state => ({
            players: msg.reconnected
              ? state.players.map(p => p.name === msg.name ? { ...p, online: true } : p)
              : [...state.players, { name: msg.name, score: 0, has_guessed: false, online: true }]
          }))
          const message = msg.reconnected
            ? `${msg.name} reconnected!`
            : `${msg.name} joined!`
          const type = msg.reconnected ? 'success' : 'info'
          websocketService.showNotification(message, type)
        }
        break

      case 'player_disconnected':
        gameStore.setState(state => ({
          players: state.players.map(p => p.name === msg.name ? { ...p, online: false } : p)
        }))
        websocketService.showNotification(`${msg.name} disconnected`, 'warning')
        break

      case 'game_state':
        {
          const { playerName } = gameStore.getState()
          const localPlayer = msg.players.find(p => p.name === playerName)
          gameStore.setState({
            players: msg.players,
            currentRound: msg.current_round,
            roundActive: msg.round_active,
            roundData: msg.round_data ?? null,
            results: msg.round_results ?? null,
            hasGuessed: localPlayer?.has_guessed ?? false,
          })
        }
        break

      case 'round_started':
        gameStore.setState(state => ({
          currentRound: msg.round_number,
          roundData: msg.round_data,
          roundActive: true,
          hasGuessed: false,
          currentGuess: null,
          results: null,
          players: state.players.map(p => ({ ...p, has_guessed: false }))
        }))
        websocketService.showNotification(`Round ${msg.round_number + 1} started!`, 'info')
        break

      case 'guess_submitted':
        gameStore.setState(state => ({
          players: state.players.map(p =>
            p.name === msg.name ? { ...p, has_guessed: true } : p
          )
        }))
        break

      case 'round_ended':
        gameStore.setState(state => ({
          results: msg,
          roundActive: false,
          players: state.players.map(p => {
            const result = msg.results.find(r => r.name === p.name)
            return result ? { ...p, score: result.total_score } : p
          })
        }))
        break

      case 'game_reset':
        gameStore.setState({
          currentRound: null,
          roundActive: false,
          roundData: null,
          results: null,
          hasGuessed: false,
          currentGuess: null,
        })
        websocketService.showNotification('Game reset! Starting fresh.', 'info')
        break

      default:
        console.warn('Unknown message type:', msg)
    }
  },

  /**
   * Show notification to user
   */
  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    gameStore.setState({ notification: { message, type } })
    setTimeout(() => gameStore.setState({ notification: null }), 3000)
  }
}
