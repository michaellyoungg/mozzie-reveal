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
struct GameConfig {
    title: String,
    puppy_name: String,
    puppy_image: String,
    actual_breeds: Vec<BreedInfo>,
    decoy_breeds: Vec<String>,
}

impl GameConfig {
    fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_str = fs::read_to_string("game_config.json")?;
        let config: GameConfig = serde_json::from_str(&config_str)?;
        Ok(config)
    }

    fn all_breed_names(&self) -> Vec<String> {
        let mut breeds: Vec<String> = self.actual_breeds.iter()
            .map(|b| b.name.clone())
            .collect();
        breeds.extend(self.decoy_breeds.clone());
        breeds.sort();
        breeds
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
enum ClientMessage {
    #[serde(rename = "join")]
    Join {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        player_id: Option<String>,
    },
    #[serde(rename = "submit_guesses")]
    SubmitGuesses {
        guesses: Vec<BreedGuess>,
    },
    #[serde(rename = "start_round")]
    StartRound,
    #[serde(rename = "reveal")]
    Reveal,
}

// Server Messages
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
        available_breeds: Vec<String>,
    },
    #[serde(rename = "player_joined")]
    PlayerJoined { name: String, player_count: usize, reconnected: bool },
    #[serde(rename = "player_disconnected")]
    PlayerDisconnected { name: String },
    #[serde(rename = "game_state")]
    GameState { players: Vec<PlayerInfo>, round_active: bool },
    #[serde(rename = "round_started")]
    RoundStarted,
    #[serde(rename = "guess_submitted")]
    GuessSubmitted { name: String },
    #[serde(rename = "round_ended")]
    RoundEnded { results: Vec<PlayerResult>, actual_breeds: Vec<BreedInfo> },
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
    guesses: Vec<BreedGuess>,
    points_earned: f32,
    total_score: f32,
    correct_breeds: Vec<String>,
}

struct Player {
    name: String,
    score: f32,
    current_guesses: Option<Vec<BreedGuess>>,
    online: bool,
}

struct GameState {
    players: HashMap<String, Player>,
    round_active: bool,
    config: Arc<GameConfig>,
}

impl GameState {
    fn new(config: Arc<GameConfig>) -> Self {
        Self {
            players: HashMap::new(),
            round_active: false,
            config,
        }
    }

    fn add_player(&mut self, id: String, name: String) {
        self.players.insert(id, Player {
            name,
            score: 0.0,
            current_guesses: None,
            online: true,
        });
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
        self.round_active = true;
        // Clear all guesses
        for player in self.players.values_mut() {
            player.current_guesses = None;
        }
    }

    fn submit_guesses(&mut self, player_id: &str, guesses: Vec<BreedGuess>) {
        if let Some(player) = self.players.get_mut(player_id) {
            player.current_guesses = Some(guesses);
        }
    }

    fn calculate_score(&self, guesses: &[BreedGuess]) -> (f32, Vec<String>) {
        let mut points = 0.0;
        let mut correct_breeds = Vec::new();

        for guess in guesses {
            // Check if this breed is actually in the dog
            if let Some(actual) = self.config.actual_breeds.iter()
                .find(|b| b.name.eq_ignore_ascii_case(&guess.name)) {

                // Award points equal to the actual percentage
                points += actual.percentage;
                correct_breeds.push(actual.name.clone());

                // Bonus points for accurate percentage guess (within ±5%)
                let percentage_diff = (guess.percentage - actual.percentage).abs();
                if percentage_diff <= 5.0 {
                    points += 5.0;
                }
            }
        }

        (points, correct_breeds)
    }

    fn reveal_answer(&mut self) -> Vec<PlayerResult> {
        let mut results = Vec::new();

        // Collect player IDs and guesses first to avoid borrow checker issues
        let player_data: Vec<(String, String, Vec<BreedGuess>)> = self.players.iter()
            .filter_map(|(id, p)| {
                p.current_guesses.as_ref().map(|g| (id.clone(), p.name.clone(), g.clone()))
            })
            .collect();

        // Calculate scores and update players
        for (player_id, player_name, guesses) in player_data {
            let (points_earned, correct_breeds) = self.calculate_score(&guesses);

            if let Some(player) = self.players.get_mut(&player_id) {
                player.score += points_earned;

                results.push(PlayerResult {
                    name: player_name,
                    guesses,
                    points_earned,
                    total_score: player.score,
                    correct_breeds,
                });
            }
        }

        self.round_active = false;
        results
    }

    fn get_player_info(&self) -> Vec<PlayerInfo> {
        self.players.values().map(|p| PlayerInfo {
            name: p.name.clone(),
            score: p.score,
            has_guessed: p.current_guesses.is_some(),
            online: p.online,
        }).collect()
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
                    ClientMessage::Join { name, player_id: existing_id } => {
                        let mut state = game_state.write().await;
                        let (pid, reconnected) = if let Some(id) = existing_id {
                            // Attempt reconnection
                            if let Some(player_name) = state.reconnect_player(&id) {
                                println!("Player {} reconnected as {}", id, player_name);
                                (id, true)
                            } else {
                                // ID not found, create new player
                                let new_id = Uuid::new_v4().to_string();
                                state.add_player(new_id.clone(), name.clone());
                                println!("New player {} joined as {}", new_id, name);
                                (new_id, false)
                            }
                        } else {
                            // New player
                            let new_id = Uuid::new_v4().to_string();
                            state.add_player(new_id.clone(), name.clone());
                            println!("New player {} joined as {}", new_id, name);
                            (new_id, false)
                        };

                        player_id = Some(pid.clone());
                        let player_count = state.players.len();
                        let config = state.config.clone();
                        let current_state = ServerMessage::GameState {
                            players: state.get_player_info(),
                            round_active: state.round_active,
                        };
                        drop(state);

                        // Send welcome with player_id
                        let _ = tx.send(ServerMessage::Welcome {
                            player_id: pid,
                        });

                        // Send game config
                        let _ = tx.send(ServerMessage::Config {
                            title: config.title.clone(),
                            puppy_name: config.puppy_name.clone(),
                            puppy_image: config.puppy_image.clone(),
                            available_breeds: config.all_breed_names(),
                        });

                        // Broadcast join/reconnect
                        let _ = tx.send(ServerMessage::PlayerJoined {
                            name,
                            player_count,
                            reconnected,
                        });

                        // Send current game state
                        let _ = tx.send(current_state);
                    }
                    ClientMessage::SubmitGuesses { guesses } => {
                        if let Some(ref pid) = player_id {
                            let mut state = game_state.write().await;
                            if let Some(player) = state.players.get(pid) {
                                let player_name = player.name.clone();
                                state.submit_guesses(pid, guesses);
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
                        drop(state);

                        let _ = tx.send(ServerMessage::RoundStarted);
                    }
                    ClientMessage::Reveal => {
                        let mut state = game_state.write().await;
                        let results = state.reveal_answer();
                        let actual_breeds = state.config.actual_breeds.clone();
                        drop(state);

                        let _ = tx.send(ServerMessage::RoundEnded {
                            results,
                            actual_breeds,
                        });
                    }
                }
            }
        }
    }

    // Cleanup - mark as offline instead of removing
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
    // Load game configuration
    let config = match GameConfig::load() {
        Ok(c) => {
            println!("Loaded game config: {}", c.title);
            println!("Actual breeds: {:?}", c.actual_breeds.iter().map(|b| &b.name).collect::<Vec<_>>());
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

    println!("Puppy Breed Guessing Game WebSocket server running on ws://{}", addr);

    while let Ok((stream, addr)) = listener.accept().await {
        let game_state = game_state.clone();
        let tx = tx.clone();
        tokio::spawn(handle_connection(stream, addr, game_state, tx));
    }
}
