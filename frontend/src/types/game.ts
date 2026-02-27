// Player types
export interface PlayerInfo {
  name: string
  score: number
  has_guessed: boolean
  online: boolean
}

// Round data types
export interface BreedPercentageRoundData {
  type: 'breed_percentage'
  title: string
  question: string
  available_breeds: string[]
}

export interface NumericGuessRoundData {
  type: 'numeric_guess'
  title: string
  question: string
  unit: string
}

export interface MultiSelectRoundData {
  type: 'multi_select'
  title: string
  question: string
  options: string[]
}

export interface MultipleChoiceRoundData {
  type: 'multiple_choice'
  title: string
  question: string
  options: string[]
}

export type RoundData =
  | BreedPercentageRoundData
  | NumericGuessRoundData
  | MultiSelectRoundData
  | MultipleChoiceRoundData

// Guess types
export interface BreedGuess {
  name: string
  percentage: number
}

export interface BreedPercentageGuess {
  type: 'breed_percentage'
  guesses: BreedGuess[]
}

export interface NumericGuess {
  type: 'numeric'
  value: number
}

export interface MultiSelectGuess {
  type: 'multi_select'
  selections: string[]
}

export interface MultipleChoiceGuess {
  type: 'multiple_choice'
  selection: string
}

export type GuessData =
  | BreedPercentageGuess
  | NumericGuess
  | MultiSelectGuess
  | MultipleChoiceGuess

// Result types
export interface PlayerResult {
  name: string
  guess: unknown
  points_earned: number
  total_score: number
  details: string
}

export interface RoundResults {
  round_number: number
  results: PlayerResult[]
  correct_answer: unknown
}

// Game config
export interface GameConfig {
  title: string
  puppy_name: string
  puppy_image: string
  total_rounds: number
}

// Notification
export interface Notification {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

// WebSocket message types
export interface WelcomeMessage {
  type: 'welcome'
  player_id: string
}

export interface ConfigMessage {
  type: 'config'
  title: string
  puppy_name: string
  puppy_image: string
  total_rounds: number
}

export interface PlayerJoinedMessage {
  type: 'player_joined'
  name: string
  player_count: number
  reconnected: boolean
}

export interface PlayerDisconnectedMessage {
  type: 'player_disconnected'
  name: string
}

export interface GameStateMessage {
  type: 'game_state'
  players: PlayerInfo[]
  current_round: number | null
  round_active: boolean
}

export interface RoundStartedMessage {
  type: 'round_started'
  round_number: number
  round_data: RoundData
}

export interface GuessSubmittedMessage {
  type: 'guess_submitted'
  name: string
}

export interface RoundEndedMessage {
  type: 'round_ended'
  round_number: number
  results: PlayerResult[]
  correct_answer: unknown
}

export type ServerMessage =
  | WelcomeMessage
  | ConfigMessage
  | PlayerJoinedMessage
  | PlayerDisconnectedMessage
  | GameStateMessage
  | RoundStartedMessage
  | GuessSubmittedMessage
  | RoundEndedMessage
