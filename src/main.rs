use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum ClientMessage {
    #[serde(rename = "join")]
    Join {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        player_id: Option<String>,
    },
    #[serde(rename = "guess")]
    Guess { breed: String },
    #[serde(rename = "start_round")]
    StartRound { image_url: String, correct_breed: String },
    #[serde(rename = "reveal")]
    Reveal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
enum ServerMessage {
    #[serde(rename = "welcome")]
    Welcome { player_id: String },
    #[serde(rename = "player_joined")]
    PlayerJoined { name: String, player_count: usize, reconnected: bool },
    #[serde(rename = "player_disconnected")]
    PlayerDisconnected { name: String },
    #[serde(rename = "game_state")]
    GameState { players: Vec<PlayerInfo>, round_active: bool, image_url: Option<String> },
    #[serde(rename = "round_started")]
    RoundStarted { image_url: String },
    #[serde(rename = "guess_submitted")]
    GuessSubmitted { name: String, has_guessed: bool },
    #[serde(rename = "round_ended")]
    RoundEnded { correct_breed: String, results: Vec<RoundResult> },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct PlayerInfo {
    name: String,
    score: u32,
    has_guessed: bool,
    online: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RoundResult {
    name: String,
    guess: String,
    correct: bool,
    score: u32,
}

struct Player {
    name: String,
    score: u32,
    current_guess: Option<String>,
    online: bool,
}

struct GameState {
    players: HashMap<String, Player>,
    round_active: bool,
    current_image: Option<String>,
    correct_breed: Option<String>,
}

impl GameState {
    fn new() -> Self {
        Self {
            players: HashMap::new(),
            round_active: false,
            current_image: None,
            correct_breed: None,
        }
    }

    fn add_player(&mut self, id: String, name: String) {
        self.players.insert(id, Player {
            name,
            score: 0,
            current_guess: None,
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

    fn start_round(&mut self, image_url: String, correct_breed: String) {
        self.round_active = true;
        self.current_image = Some(image_url);
        self.correct_breed = Some(correct_breed);

        // Clear all guesses
        for player in self.players.values_mut() {
            player.current_guess = None;
        }
    }

    fn submit_guess(&mut self, player_id: &str, guess: String) {
        if let Some(player) = self.players.get_mut(player_id) {
            player.current_guess = Some(guess);
        }
    }

    fn reveal_answer(&mut self) -> Vec<RoundResult> {
        let mut results = Vec::new();

        if let Some(correct) = &self.correct_breed {
            for player in self.players.values_mut() {
                if let Some(guess) = &player.current_guess {
                    let is_correct = guess.to_lowercase() == correct.to_lowercase();
                    if is_correct {
                        player.score += 10;
                    }
                    results.push(RoundResult {
                        name: player.name.clone(),
                        guess: guess.clone(),
                        correct: is_correct,
                        score: player.score,
                    });
                }
            }
        }

        self.round_active = false;
        results
    }

    fn get_player_info(&self) -> Vec<PlayerInfo> {
        self.players.values().map(|p| PlayerInfo {
            name: p.name.clone(),
            score: p.score,
            has_guessed: p.current_guess.is_some(),
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
                        let current_state = ServerMessage::GameState {
                            players: state.get_player_info(),
                            round_active: state.round_active,
                            image_url: state.current_image.clone(),
                        };
                        drop(state);

                        // Send welcome with player_id first
                        let _ = tx.send(ServerMessage::Welcome {
                            player_id: pid,
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
                    ClientMessage::Guess { breed } => {
                        if let Some(ref pid) = player_id {
                            let mut state = game_state.write().await;
                            if let Some(player) = state.players.get(pid) {
                                let player_name = player.name.clone();
                                state.submit_guess(pid, breed);
                                drop(state);

                                let _ = tx.send(ServerMessage::GuessSubmitted {
                                    name: player_name,
                                    has_guessed: true,
                                });
                            }
                        }
                    }
                    ClientMessage::StartRound { image_url, correct_breed } => {
                        let mut state = game_state.write().await;
                        state.start_round(image_url.clone(), correct_breed);
                        drop(state);

                        let _ = tx.send(ServerMessage::RoundStarted { image_url });
                    }
                    ClientMessage::Reveal => {
                        let mut state = game_state.write().await;
                        let results = state.reveal_answer();
                        let correct = state.correct_breed.clone().unwrap_or_default();
                        drop(state);

                        let _ = tx.send(ServerMessage::RoundEnded {
                            correct_breed: correct,
                            results,
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
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await.expect("Failed to bind");

    let game_state = Arc::new(RwLock::new(GameState::new()));
    let (tx, _) = broadcast::channel(100);

    println!("Puppy Breed Guessing Game WebSocket server running on ws://{}", addr);

    while let Ok((stream, addr)) = listener.accept().await {
        let game_state = game_state.clone();
        let tx = tx.clone();
        tokio::spawn(handle_connection(stream, addr, game_state, tx));
    }
}
