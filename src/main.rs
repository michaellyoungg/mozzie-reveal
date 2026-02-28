mod game;
mod handlers;
mod types;

use std::env;
use std::sync::Arc;

use axum::Router;
use tokio::net::TcpListener;
use tokio::sync::{broadcast, RwLock};
use tower_http::services::ServeDir;

use game::GameState;
use handlers::ws_handler;
use types::{GameConfig, ServerMessage};

const DEFAULT_CONFIG_PATH: &str = "game_config.json";
const DEFAULT_PORT: &str = "8080";

#[derive(Clone)]
pub struct AppState {
    pub game_state: Arc<RwLock<GameState>>,
    pub tx: broadcast::Sender<ServerMessage>,
}

#[tokio::main]
async fn main() {
    // Load configuration
    let config_path =
        env::var("GAME_CONFIG_PATH").unwrap_or_else(|_| DEFAULT_CONFIG_PATH.to_string());
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

    // Initialize game state and broadcast channel
    let game_state = Arc::new(RwLock::new(GameState::new(config)));
    let (tx, _) = broadcast::channel(100);

    let app_state = AppState { game_state, tx };

    // Build router: WebSocket at /ws, static files as fallback
    let app = Router::new()
        .route("/ws", axum::routing::get(ws_handler))
        .fallback_service(ServeDir::new("static"))
        .with_state(app_state);

    // Bind to 0.0.0.0:{PORT} (Railway provides PORT env var)
    let port = env::var("PORT").unwrap_or_else(|_| DEFAULT_PORT.to_string());
    let bind_addr = format!("0.0.0.0:{}", port);

    let listener = match TcpListener::bind(&bind_addr).await {
        Ok(l) => {
            println!("Server running on http://{}", bind_addr);
            l
        }
        Err(e) => {
            eprintln!("Failed to bind to {}: {}", bind_addr, e);
            return;
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Server error: {}", e);
    }
}
