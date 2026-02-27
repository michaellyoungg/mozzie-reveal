use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

// Game Configuration Structures
#[derive(Serialize, Deserialize, Debug, Clone)]
struct BreedInfo {
    name: String,
    percentage: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum RoundConfig {
    #[serde(rename = "breed_percentage")]
    BreedPercentage {
        id: u32,
        title: String,
        question: String,
        actual_breeds: Vec<BreedInfo>,
        decoy_breeds: Vec<String>,
        scoring: BreedScoringConfig,
    },
    #[serde(rename = "numeric_guess")]
    NumericGuess {
        id: u32,
        title: String,
        question: String,
        unit: String,
        correct_answer: f32,
        scoring: NumericScoringConfig,
    },
    #[serde(rename = "multi_select")]
    MultiSelect {
        id: u32,
        title: String,
        question: String,
        options: Vec<String>,
        correct_answers: Vec<String>,
        scoring: MultiSelectScoringConfig,
    },
    #[serde(rename = "multiple_choice")]
    MultipleChoice {
        id: u32,
        title: String,
        question: String,
        options: Vec<String>,
        correct_answer: String,
        scoring: MultipleChoiceScoringConfig,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct BreedScoringConfig {
    percentage_accuracy_bonus: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct GraduatedBracket {
    within: f32,
    points: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct NumericScoringConfig {
    brackets: Vec<GraduatedBracket>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct MultiSelectScoringConfig {
    per_correct: f32,
    per_incorrect: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct MultipleChoiceScoringConfig {
    correct: f32,
    incorrect: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct GameConfig {
    title: String,
    puppy_name: String,
    puppy_image: String,
    rounds: Vec<RoundConfig>,
}

impl GameConfig {
    fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_str = fs::read_to_string("game_config.json")?;
        let config: GameConfig = serde_json::from_str(&config_str)?;
        Ok(config)
    }
}

// Client Messages
#[derive(Serialize, Deserialize, Debug, Clone)]
struct BreedGuess {
    name: String,
    percentage: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum GuessData {
    #[serde(rename = "breed_percentage")]
    BreedPercentage { guesses: Vec<BreedGuess> },
    #[serde(rename = "numeric")]
    Numeric { value: f32 },
    #[serde(rename = "multi_select")]
    MultiSelect { selections: Vec<String> },
    #[serde(rename = "multiple_choice")]
    MultipleChoice { selection: String },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum ClientMessage {
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
}

// Server Messages
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum RoundData {
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

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum ServerMessage {
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
        correct_answer: serde_json::Value,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct PlayerInfo {
    name: String,
    score: f32,
    has_guessed: bool,
    online: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct PlayerResult {
    name: String,
    guess: serde_json::Value,
    points_earned: f32,
    total_score: f32,
    details: String,
}

struct Player {
    name: String,
    score: f32,
    current_guess: Option<GuessData>,
    online: bool,
}

struct GameState {
    players: HashMap<String, Player>,
    current_round: Option<usize>,
    round_active: bool,
    config: Arc<GameConfig>,
}

impl GameState {
    fn new(config: Arc<GameConfig>) -> Self {
        Self {
            players: HashMap::new(),
            current_round: None,
            round_active: false,
            config,
        }
    }

    fn add_player(&mut self, id: String, name: String) {
        self.players.insert(
            id,
            Player {
                name,
                score: 0.0,
                current_guess: None,
                online: true,
            },
        );
    }

    fn reconnect_player(&mut self, id: &str) -> Option<String> {
        if let Some(player) = self.players.get_mut(id) {
            player.online = true;
            Some(player.name.clone())
        } else {
            None
        }
    }

    fn disconnect_player(&mut self, id: &str) -> Option<String> {
        if let Some(player) = self.players.get_mut(id) {
            player.online = false;
            Some(player.name.clone())
        } else {
            None
        }
    }

    fn start_round(&mut self) {
        if self.current_round.is_none() {
            self.current_round = Some(0);
        }
        self.round_active = true;
        // Clear all guesses
        for player in self.players.values_mut() {
            player.current_guess = None;
        }
    }

    fn next_round(&mut self) -> bool {
        if let Some(current) = self.current_round {
            if current + 1 < self.config.rounds.len() {
                self.current_round = Some(current + 1);
                self.round_active = true;
                // Clear guesses
                for player in self.players.values_mut() {
                    player.current_guess = None;
                }
                return true;
            }
        }
        false
    }

    fn submit_guess(&mut self, player_id: &str, guess: GuessData) {
        if let Some(player) = self.players.get_mut(player_id) {
            player.current_guess = Some(guess);
        }
    }

    fn calculate_breed_score(
        &self,
        guesses: &[BreedGuess],
        actual_breeds: &[BreedInfo],
        bonus: f32,
    ) -> (f32, Vec<String>) {
        let mut points = 0.0;
        let mut correct_breeds = Vec::new();

        for guess in guesses {
            if let Some(actual) = actual_breeds
                .iter()
                .find(|b| b.name.eq_ignore_ascii_case(&guess.name))
            {
                points += actual.percentage;
                correct_breeds.push(actual.name.clone());

                let percentage_diff = (guess.percentage - actual.percentage).abs();
                if percentage_diff <= 5.0 {
                    points += bonus;
                }
            }
        }

        (points, correct_breeds)
    }

    fn calculate_numeric_score(
        &self,
        guess: f32,
        correct: f32,
        brackets: &[GraduatedBracket],
    ) -> f32 {
        let diff = (guess - correct).abs();

        for bracket in brackets {
            if diff <= bracket.within {
                return bracket.points;
            }
        }
        0.0
    }

    fn calculate_multi_select_score(
        &self,
        selections: &[String],
        correct: &[String],
        per_correct: f32,
        per_incorrect: f32,
    ) -> (f32, Vec<String>, Vec<String>) {
        let mut points = 0.0;
        let mut correct_selections = Vec::new();
        let mut incorrect_selections = Vec::new();

        for selection in selections {
            if correct
                .iter()
                .any(|c| c.eq_ignore_ascii_case(selection))
            {
                points += per_correct;
                correct_selections.push(selection.clone());
            } else {
                points += per_incorrect;
                incorrect_selections.push(selection.clone());
            }
        }

        (points, correct_selections, incorrect_selections)
    }

    fn reveal_answer(&mut self) -> Vec<PlayerResult> {
        let mut results = Vec::new();

        if let Some(round_idx) = self.current_round {
            let round = &self.config.rounds[round_idx];

            let player_data: Vec<(String, String, Option<GuessData>)> = self
                .players
                .iter()
                .map(|(id, p)| (id.clone(), p.name.clone(), p.current_guess.clone()))
                .collect();

            for (player_id, player_name, guess_opt) in player_data {
                if let Some(guess) = guess_opt {
                    let (points_earned, guess_json, details) = match (&round, &guess) {
                        (
                            RoundConfig::BreedPercentage {
                                actual_breeds,
                                scoring,
                                ..
                            },
                            GuessData::BreedPercentage { guesses },
                        ) => {
                            let (pts, correct_breeds) = self.calculate_breed_score(
                                guesses,
                                actual_breeds,
                                scoring.percentage_accuracy_bonus,
                            );
                            let details = format!(
                                "Correct breeds: {}",
                                if correct_breeds.is_empty() {
                                    "None".to_string()
                                } else {
                                    correct_breeds.join(", ")
                                }
                            );
                            (pts, serde_json::to_value(guesses).unwrap(), details)
                        }
                        (
                            RoundConfig::NumericGuess {
                                correct_answer,
                                scoring,
                                ..
                            },
                            GuessData::Numeric { value },
                        ) => {
                            let pts =
                                self.calculate_numeric_score(*value, *correct_answer, &scoring.brackets);
                            let diff = (value - correct_answer).abs();
                            let details = format!("Off by {:.1}", diff);
                            (pts, serde_json::to_value(value).unwrap(), details)
                        }
                        (
                            RoundConfig::MultiSelect {
                                correct_answers,
                                scoring,
                                ..
                            },
                            GuessData::MultiSelect { selections },
                        ) => {
                            let (pts, correct_sels, incorrect_sels) = self
                                .calculate_multi_select_score(
                                    selections,
                                    correct_answers,
                                    scoring.per_correct,
                                    scoring.per_incorrect,
                                );
                            let details = format!(
                                "Correct: {}, Incorrect: {}",
                                correct_sels.len(),
                                incorrect_sels.len()
                            );
                            (pts, serde_json::to_value(selections).unwrap(), details)
                        }
                        (
                            RoundConfig::MultipleChoice {
                                correct_answer,
                                scoring,
                                ..
                            },
                            GuessData::MultipleChoice { selection },
                        ) => {
                            let pts = if selection.eq_ignore_ascii_case(correct_answer) {
                                scoring.correct
                            } else {
                                scoring.incorrect
                            };
                            let details = if pts > 0.0 {
                                "Correct!".to_string()
                            } else {
                                "Incorrect".to_string()
                            };
                            (pts, serde_json::to_value(selection).unwrap(), details)
                        }
                        _ => (0.0, serde_json::Value::Null, "Type mismatch".to_string()),
                    };

                    if let Some(player) = self.players.get_mut(&player_id) {
                        player.score += points_earned;

                        results.push(PlayerResult {
                            name: player_name,
                            guess: guess_json,
                            points_earned,
                            total_score: player.score,
                            details,
                        });
                    }
                }
            }
        }

        self.round_active = false;
        results
    }

    fn get_player_info(&self) -> Vec<PlayerInfo> {
        self.players
            .values()
            .map(|p| PlayerInfo {
                name: p.name.clone(),
                score: p.score,
                has_guessed: p.current_guess.is_some(),
                online: p.online,
            })
            .collect()
    }

    fn get_current_round_data(&self) -> Option<RoundData> {
        if let Some(round_idx) = self.current_round {
            let round = &self.config.rounds[round_idx];
            match round {
                RoundConfig::BreedPercentage {
                    title,
                    question,
                    actual_breeds,
                    decoy_breeds,
                    ..
                } => {
                    let mut all_breeds: Vec<String> =
                        actual_breeds.iter().map(|b| b.name.clone()).collect();
                    all_breeds.extend(decoy_breeds.clone());
                    all_breeds.sort();

                    Some(RoundData::BreedPercentage {
                        title: title.clone(),
                        question: question.clone(),
                        available_breeds: all_breeds,
                    })
                }
                RoundConfig::NumericGuess {
                    title,
                    question,
                    unit,
                    ..
                } => Some(RoundData::NumericGuess {
                    title: title.clone(),
                    question: question.clone(),
                    unit: unit.clone(),
                }),
                RoundConfig::MultiSelect {
                    title,
                    question,
                    options,
                    ..
                } => Some(RoundData::MultiSelect {
                    title: title.clone(),
                    question: question.clone(),
                    options: options.clone(),
                }),
                RoundConfig::MultipleChoice {
                    title,
                    question,
                    options,
                    ..
                } => Some(RoundData::MultipleChoice {
                    title: title.clone(),
                    question: question.clone(),
                    options: options.clone(),
                }),
            }
        } else {
            None
        }
    }

    fn get_correct_answer(&self) -> Option<serde_json::Value> {
        if let Some(round_idx) = self.current_round {
            let round = &self.config.rounds[round_idx];
            match round {
                RoundConfig::BreedPercentage { actual_breeds, .. } => {
                    Some(serde_json::to_value(actual_breeds).unwrap())
                }
                RoundConfig::NumericGuess { correct_answer, .. } => {
                    Some(serde_json::to_value(correct_answer).unwrap())
                }
                RoundConfig::MultiSelect {
                    correct_answers, ..
                } => Some(serde_json::to_value(correct_answers).unwrap()),
                RoundConfig::MultipleChoice {
                    correct_answer, ..
                } => Some(serde_json::to_value(correct_answer).unwrap()),
            }
        } else {
            None
        }
    }
}

type SharedGameState = Arc<RwLock<GameState>>;

async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    game_state: SharedGameState,
    tx: broadcast::Sender<ServerMessage>,
) {
    println!("New connection from: {}", addr);

    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("Error during WebSocket handshake: {}", e);
            return;
        }
    };

    let (mut write, mut read) = ws_stream.split();
    let mut rx = tx.subscribe();
    let mut player_id: Option<String> = None;

    // Broadcast task
    let broadcast_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if write.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Message handling task
    while let Some(msg) = read.next().await {
        let msg = match msg {
            Ok(msg) => msg,
            Err(_) => break,
        };

        if msg.is_close() {
            break;
        }

        if msg.is_text() {
            let text = msg.to_text().unwrap();

            if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(text) {
                match client_msg {
                    ClientMessage::Join {
                        name,
                        player_id: existing_id,
                    } => {
                        let mut state = game_state.write().await;
                        let (pid, reconnected) = if let Some(id) = existing_id {
                            if let Some(player_name) = state.reconnect_player(&id) {
                                println!("Player {} reconnected as {}", id, player_name);
                                (id, true)
                            } else {
                                let new_id = Uuid::new_v4().to_string();
                                state.add_player(new_id.clone(), name.clone());
                                println!("New player {} joined as {}", new_id, name);
                                (new_id, false)
                            }
                        } else {
                            let new_id = Uuid::new_v4().to_string();
                            state.add_player(new_id.clone(), name.clone());
                            println!("New player {} joined as {}", new_id, name);
                            (new_id, false)
                        };

                        player_id = Some(pid.clone());
                        let player_count = state.players.len();
                        let config_title = state.config.title.clone();
                        let config_puppy_name = state.config.puppy_name.clone();
                        let config_puppy_image = state.config.puppy_image.clone();
                        let total_rounds = state.config.rounds.len();
                        let current_state = ServerMessage::GameState {
                            players: state.get_player_info(),
                            current_round: state.current_round,
                            round_active: state.round_active,
                        };
                        drop(state);

                        let _ = tx.send(ServerMessage::Welcome { player_id: pid });

                        let _ = tx.send(ServerMessage::Config {
                            title: config_title,
                            puppy_name: config_puppy_name,
                            puppy_image: config_puppy_image,
                            total_rounds,
                        });

                        let _ = tx.send(ServerMessage::PlayerJoined {
                            name,
                            player_count,
                            reconnected,
                        });

                        let _ = tx.send(current_state);
                    }
                    ClientMessage::SubmitGuess { guess } => {
                        if let Some(ref pid) = player_id {
                            let mut state = game_state.write().await;
                            if let Some(player) = state.players.get(pid) {
                                let player_name = player.name.clone();
                                state.submit_guess(pid, guess);
                                drop(state);

                                let _ = tx.send(ServerMessage::GuessSubmitted {
                                    name: player_name,
                                });
                            }
                        }
                    }
                    ClientMessage::StartRound => {
                        let mut state = game_state.write().await;
                        state.start_round();
                        let round_number = state.current_round.unwrap_or(0) + 1;
                        let round_data = state.get_current_round_data();
                        drop(state);

                        if let Some(data) = round_data {
                            let _ = tx.send(ServerMessage::RoundStarted {
                                round_number,
                                round_data: data,
                            });
                        }
                    }
                    ClientMessage::Reveal => {
                        let mut state = game_state.write().await;
                        let round_number = state.current_round.unwrap_or(0) + 1;
                        let results = state.reveal_answer();
                        let correct_answer = state.get_correct_answer().unwrap_or(serde_json::Value::Null);
                        drop(state);

                        let _ = tx.send(ServerMessage::RoundEnded {
                            round_number,
                            results,
                            correct_answer,
                        });
                    }
                    ClientMessage::NextRound => {
                        let mut state = game_state.write().await;
                        let has_next = state.next_round();
                        if has_next {
                            let round_number = state.current_round.unwrap_or(0) + 1;
                            let round_data = state.get_current_round_data();
                            drop(state);

                            if let Some(data) = round_data {
                                let _ = tx.send(ServerMessage::RoundStarted {
                                    round_number,
                                    round_data: data,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // Cleanup
    broadcast_task.abort();
    if let Some(pid) = player_id {
        let mut state = game_state.write().await;
        if let Some(name) = state.disconnect_player(&pid) {
            drop(state);
            let _ = tx.send(ServerMessage::PlayerDisconnected { name: name.clone() });
            println!("Player {} ({}) disconnected", pid, name);
        }
    }
}

#[tokio::main]
async fn main() {
    let config = match GameConfig::load() {
        Ok(c) => {
            println!("Loaded game config: {}", c.title);
            println!("Total rounds: {}", c.rounds.len());
            Arc::new(c)
        }
        Err(e) => {
            eprintln!("Failed to load game_config.json: {}", e);
            eprintln!("Make sure game_config.json exists in the project root");
            return;
        }
    };

    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await.expect("Failed to bind");

    let game_state = Arc::new(RwLock::new(GameState::new(config)));
    let (tx, _) = broadcast::channel(100);

    println!(
        "Puppy Breed Guessing Game WebSocket server running on ws://{}",
        addr
    );

    while let Ok((stream, addr)) = listener.accept().await {
        let game_state = game_state.clone();
        let tx = tx.clone();
        tokio::spawn(handle_connection(stream, addr, game_state, tx));
    }
}
