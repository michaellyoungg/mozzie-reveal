use serde::{Deserialize, Serialize};

use super::messages::GuessData;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerInfo {
    pub name: String,
    pub score: f32,
    pub has_guessed: bool,
    pub online: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerResult {
    pub name: String,
    pub guess: GuessData,
    pub points_earned: f32,
    pub total_score: f32,
    pub details: String,
}

#[derive(Debug, Clone)]
pub struct Player {
    pub name: String,
    pub score: f32,
    pub current_guess: Option<GuessData>,
    pub online: bool,
}

impl Player {
    pub fn new(name: String) -> Self {
        Self {
            name,
            score: 0.0,
            current_guess: None,
            online: true,
        }
    }

    pub fn to_info(&self) -> PlayerInfo {
        PlayerInfo {
            name: self.name.clone(),
            score: self.score,
            has_guessed: self.current_guess.is_some(),
            online: self.online,
        }
    }
}
