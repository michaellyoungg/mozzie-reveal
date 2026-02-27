use std::net::SocketAddr;
use std::sync::Arc;

use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpStream;
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

use crate::game::GameState;
use crate::types::*;

pub type SharedGameState = Arc<RwLock<GameState>>;

pub async fn handle_connection(
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
            let text = msg.to_text().unwrap_or("");

            if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(text) {
                handle_client_message(
                    client_msg,
                    &mut player_id,
                    &game_state,
                    &tx,
                )
                .await;
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

async fn handle_client_message(
    msg: ClientMessage,
    player_id: &mut Option<String>,
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
) {
    match msg {
        ClientMessage::Join {
            name,
            player_id: existing_id,
        } => {
            handle_join(name, existing_id, player_id, game_state, tx).await;
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
    }
}

async fn handle_join(
    name: String,
    existing_id: Option<String>,
    player_id: &mut Option<String>,
    game_state: &SharedGameState,
    tx: &broadcast::Sender<ServerMessage>,
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
    let current_state = ServerMessage::GameState {
        players: state.get_player_info(),
        current_round: state.current_round_number(),
        round_active: state.is_round_active(),
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
