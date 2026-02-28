use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{broadcast, mpsc, RwLock};
use uuid::Uuid;

use crate::game::GameState;
use crate::types::*;
use crate::AppState;

pub type SharedGameState = Arc<RwLock<GameState>>;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_connection(socket, state.game_state, state.tx))
}

async fn handle_connection(
    socket: WebSocket,
    game_state: SharedGameState,
    tx: broadcast::Sender<ServerMessage>,
) {
    let (mut write, mut read) = socket.split();
    let mut rx = tx.subscribe();
    let (unicast_tx, mut unicast_rx) = mpsc::channel::<ServerMessage>(32);
    let mut player_id: Option<String> = None;

    // Write task: forwards both broadcast and unicast messages to this client
    let write_task = tokio::spawn(async move {
        loop {
            let msg = tokio::select! {
                result = rx.recv() => {
                    match result {
                        Ok(msg) => msg,
                        Err(broadcast::error::RecvError::Lagged(n)) => {
                            eprintln!("Broadcast lagged by {} messages", n);
                            continue;
                        }
                        Err(broadcast::error::RecvError::Closed) => break,
                    }
                }
                result = unicast_rx.recv() => {
                    match result {
                        Some(msg) => msg,
                        None => break,
                    }
                }
            };
            if let Ok(json) = serde_json::to_string(&msg) {
                if write.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Message handling loop
    while let Some(msg) = read.next().await {
        let msg = match msg {
            Ok(msg) => msg,
            Err(_) => break,
        };

        match msg {
            Message::Text(text) => {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    handle_client_message(
                        client_msg,
                        &mut player_id,
                        &game_state,
                        &tx,
                        &unicast_tx,
                    )
                    .await;
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    // Cleanup
    write_task.abort();
    if let Some(pid) = player_id {
        let mut state = game_state.write().await;
        if let Some(name) = state.disconnect_player(&pid) {
            drop(state);
            let _ = tx.send(ServerMessage::PlayerDisconnected { name: name.clone() });
            println!("Player {} ({}) disconnected", pid, name);
        }
    }
}

async fn handle_client_message(
    msg: ClientMessage,
    player_id: &mut Option<String>,
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
    unicast_tx: &mpsc::Sender<ServerMessage>,
) {
    match msg {
        ClientMessage::Join {
            name,
            player_id: existing_id,
        } => {
            handle_join(name, existing_id, player_id, game_state, tx, unicast_tx).await;
        }
        ClientMessage::SubmitGuess { guess } => {
            if let Some(ref pid) = player_id {
                handle_submit_guess(pid, guess, game_state, tx).await;
            }
        }
        ClientMessage::StartRound => {
            handle_start_round(game_state, tx).await;
        }
        ClientMessage::Reveal => {
            handle_reveal(game_state, tx).await;
        }
        ClientMessage::NextRound => {
            handle_next_round(game_state, tx).await;
        }
        ClientMessage::ResetGame => {
            handle_reset_game(game_state, tx).await;
        }
        ClientMessage::AdminConnect => {
            handle_admin_connect(game_state, unicast_tx).await;
        }
    }
}

async fn handle_join(
    name: String,
    existing_id: Option<String>,
    player_id: &mut Option<String>,
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
    unicast_tx: &mpsc::Sender<ServerMessage>,
) {
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

    *player_id = Some(pid.clone());
    let player_count = state.player_count();
    let config_title = state.config_title().to_string();
    let config_puppy_name = state.config_puppy_name().to_string();
    let config_puppy_image = state.config_puppy_image().to_string();
    let total_rounds = state.total_rounds();

    // Build enriched game state with round data and results for reconnection
    let round_data = if state.is_round_active() {
        state.get_current_round_data()
    } else {
        None
    };
    let round_results = state.last_round_results().cloned();

    let current_state = ServerMessage::GameState {
        players: state.get_player_info(),
        current_round: state.current_round_number(),
        round_active: state.is_round_active(),
        round_data,
        round_results,
    };
    drop(state);

    // Unicast: only this player needs these
    let _ = unicast_tx.send(ServerMessage::Welcome { player_id: pid }).await;
    let _ = unicast_tx.send(ServerMessage::Config {
        title: config_title,
        puppy_name: config_puppy_name,
        puppy_image: config_puppy_image,
        total_rounds,
    }).await;
    let _ = unicast_tx.send(current_state).await;

    // Broadcast: everyone should know a player joined
    let _ = tx.send(ServerMessage::PlayerJoined {
        name,
        player_count,
        reconnected,
    });
}

async fn handle_submit_guess(
    player_id: &str,
    guess: GuessData,
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    let mut state = game_state.write().await;
    if let Some(player_name) = state.get_player_name(player_id) {
        let player_name = player_name.to_string();
        state.submit_guess(player_id, guess);
        drop(state);

        let _ = tx.send(ServerMessage::GuessSubmitted {
            name: player_name,
        });
    }
}

async fn handle_start_round(
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    let mut state = game_state.write().await;
    state.start_round();
    let round_number = state.current_round_number().unwrap_or(0);
    let round_data = state.get_current_round_data();
    drop(state);

    if let Some(data) = round_data {
        let _ = tx.send(ServerMessage::RoundStarted {
            round_number,
            round_data: data,
        });
    }
}

async fn handle_reveal(
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    let mut state = game_state.write().await;
    let round_number = state.current_round_number().unwrap_or(0);
    let results = state.reveal_answer();
    let correct_answer = state.get_correct_answer();
    drop(state);

    if let Some(answer) = correct_answer {
        let _ = tx.send(ServerMessage::RoundEnded {
            round_number,
            results,
            correct_answer: answer,
        });
    }
}

async fn handle_next_round(
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    let mut state = game_state.write().await;
    let has_next = state.next_round();
    if has_next {
        let round_number = state.current_round_number().unwrap_or(0);
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

async fn handle_reset_game(
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    let mut state = game_state.write().await;
    state.reset();
    let game_state_msg = ServerMessage::GameState {
        players: state.get_player_info(),
        current_round: state.current_round_number(),
        round_active: state.is_round_active(),
        round_data: None,
        round_results: None,
    };
    drop(state);

    let _ = tx.send(ServerMessage::GameReset);
    let _ = tx.send(game_state_msg);
}

async fn handle_admin_connect(
    game_state: &SharedGameState,
    unicast_tx: &mpsc::Sender<ServerMessage>,
) {
    let state = game_state.read().await;
    let config_title = state.config_title().to_string();
    let config_puppy_name = state.config_puppy_name().to_string();
    let config_puppy_image = state.config_puppy_image().to_string();
    let total_rounds = state.total_rounds();

    let round_data = if state.is_round_active() {
        state.get_current_round_data()
    } else {
        None
    };
    let round_results = state.last_round_results().cloned();

    let current_state = ServerMessage::GameState {
        players: state.get_player_info(),
        current_round: state.current_round_number(),
        round_active: state.is_round_active(),
        round_data,
        round_results,
    };
    drop(state);

    let _ = unicast_tx.send(ServerMessage::Config {
        title: config_title,
        puppy_name: config_puppy_name,
        puppy_image: config_puppy_image,
        total_rounds,
    }).await;
    let _ = unicast_tx.send(current_state).await;
}
