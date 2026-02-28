use serde::{Deserialize, Serialize};

use super::player::{PlayerInfo, PlayerResult};

// Client message guess data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BreedGuess {
    pub name: String,
    pub percentage: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum GuessData {
    #[serde(rename = "breed_percentage")]
    BreedPercentage { guesses: Vec<BreedGuess> },
    #[serde(rename = "numeric")]
    Numeric { value: f32 },
    #[serde(rename = "multi_select")]
    MultiSelect { selections: Vec<String> },
    #[serde(rename = "multiple_choice")]
    MultipleChoice { selection: String },
}

// Client messages
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "join")]
    Join {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        player_id: Option<String>,
    },
    #[serde(rename = "submit_guess")]
    SubmitGuess { guess: GuessData },
    #[serde(rename = "start_round")]
    StartRound,
    #[serde(rename = "reveal")]
    Reveal,
    #[serde(rename = "next_round")]
    NextRound,
    #[serde(rename = "reset_game")]
    ResetGame,
    #[serde(rename = "admin_connect")]
    AdminConnect,
}

// Round data sent to clients
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum RoundData {
    #[serde(rename = "breed_percentage")]
    BreedPercentage {
        title: String,
        question: String,
        available_breeds: Vec<String>,
    },
    #[serde(rename = "numeric_guess")]
    NumericGuess {
        title: String,
        question: String,
        unit: String,
    },
    #[serde(rename = "multi_select")]
    MultiSelect {
        title: String,
        question: String,
        options: Vec<String>,
    },
    #[serde(rename = "multiple_choice")]
    MultipleChoice {
        title: String,
        question: String,
        options: Vec<String>,
    },
}

// Correct answer types (type-safe instead of serde_json::Value)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum CorrectAnswer {
    #[serde(rename = "breed_percentage")]
    BreedPercentage { breeds: Vec<BreedGuess> },
    #[serde(rename = "numeric")]
    Numeric { value: f32 },
    #[serde(rename = "multi_select")]
    MultiSelect { selections: Vec<String> },
    #[serde(rename = "multiple_choice")]
    MultipleChoice { selection: String },
}

// Snapshot of round results for state sync on reconnect
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RoundEndedSnapshot {
    pub round_number: usize,
    pub results: Vec<PlayerResult>,
    pub correct_answer: CorrectAnswer,
}

// Server messages
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "welcome")]
    Welcome { player_id: String },
    #[serde(rename = "config")]
    Config {
        title: String,
        puppy_name: String,
        puppy_image: String,
        total_rounds: usize,
    },
    #[serde(rename = "player_joined")]
    PlayerJoined {
        name: String,
        player_count: usize,
        reconnected: bool,
    },
    #[serde(rename = "player_disconnected")]
    PlayerDisconnected { name: String },
    #[serde(rename = "game_state")]
    GameState {
        players: Vec<PlayerInfo>,
        current_round: Option<usize>,
        round_active: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        round_data: Option<RoundData>,
        #[serde(skip_serializing_if = "Option::is_none")]
        round_results: Option<RoundEndedSnapshot>,
    },
    #[serde(rename = "round_started")]
    RoundStarted {
        round_number: usize,
        round_data: RoundData,
    },
    #[serde(rename = "guess_submitted")]
    GuessSubmitted { name: String },
    #[serde(rename = "round_ended")]
    RoundEnded {
        round_number: usize,
        results: Vec<PlayerResult>,
        correct_answer: CorrectAnswer,
    },
    #[serde(rename = "game_reset")]
    GameReset,
}
