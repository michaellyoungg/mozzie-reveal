import { PlayerInfo, RoundResults } from '../types/game'

interface AdminPanelProps {
  players: PlayerInfo[]
  roundActive: boolean
  currentRound: number | null
  results: RoundResults | null
  totalRounds: number
  onStartRound: () => void
  onRevealAnswer: () => void
  onNextRound: () => void
}

export default function AdminPanel({
  players,
  roundActive,
  currentRound,
  results,
  totalRounds,
  onStartRound,
  onRevealAnswer,
  onNextRound
}: AdminPanelProps) {
  const submittedCount = players.filter(p => p.has_guessed).length

  return (
    <div className="admin-panel">
      <h3>Admin Controls</h3>

      {roundActive && (
        <div className="submission-status">
          <h4>Submission Status</h4>
          <div className="status-summary">
            {submittedCount} / {players.length} players submitted
          </div>
          <div className="player-status-list">
            {players.map((player, idx) => (
              <div
                key={idx}
                className={`player-status ${player.has_guessed ? 'submitted' : 'pending'}`}
              >
                <span className="status-icon">
                  {player.has_guessed ? '✓' : '○'}
                </span>
                <span className="status-name">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-controls">
        {!roundActive && currentRound === null && (
          <button onClick={onStartRound}>
            Start Round 1
          </button>
        )}
        {roundActive && (
          <button onClick={onRevealAnswer}>
            Reveal Answer
          </button>
        )}
        {!roundActive && results && currentRound !== null && currentRound < totalRounds - 1 && (
          <button onClick={onNextRound}>
            Next Round
          </button>
        )}
      </div>
    </div>
  )
}
