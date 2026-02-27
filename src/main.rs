mod game;
mod handlers;
mod types;

use std::env;
use std::sync::Arc;

use tokio::net::TcpListener;
use tokio::sync::{broadcast, RwLock};

use game::GameState;
use handlers::handle_connection;
use types::GameConfig;

const DEFAULT_CONFIG_PATH: &str = "game_config.json";
const DEFAULT_BIND_ADDR: &str = "127.0.0.1:8080";

#[tokio::main]
async fn main() {
    // Load configuration
    let config_path = env::var("GAME_CONFIG_PATH").unwrap_or_else(|_| DEFAULT_CONFIG_PATH.to_string());
    let config = match GameConfig::load(&config_path) {
        Ok(c) => {
            println!("Loaded game config: {}", c.title);
            println!("Total rounds: {}", c.rounds.len());
            Arc::new(c)
        }
        Err(e) => {
            eprintln!("Failed to load config from '{}': {}", config_path, e);
            eprintln!("Make sure the config file exists and is valid JSON");
            return;
        }
    };

    // Get bind address from environment or use default
    let bind_addr = env::var("BIND_ADDR").unwrap_or_else(|_| DEFAULT_BIND_ADDR.to_string());

    // Bind listener
    let listener = match TcpListener::bind(&bind_addr).await {
        Ok(l) => {
            println!(
                "Puppy Breed Guessing Game WebSocket server running on ws://{}",
                bind_addr
            );
            l
        }
        Err(e) => {
            eprintln!("Failed to bind to {}: {}", bind_addr, e);
            return;
        }
    };

    // Initialize game state and broadcast channel
    let game_state = Arc::new(RwLock::new(GameState::new(config)));
    let (tx, _) = broadcast::channel(100);

    // Accept connections
    while let Ok((stream, addr)) = listener.accept().await {
        let game_state = game_state.clone();
        let tx = tx.clone();
        tokio::spawn(handle_connection(stream, addr, game_state, tx));
    }
}
