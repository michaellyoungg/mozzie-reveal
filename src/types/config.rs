use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BreedInfo {
    pub name: String,
    pub percentage: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum RoundConfig {
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
pub struct BreedScoringConfig {
    pub percentage_accuracy_bonus: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GraduatedBracket {
    pub within: f32,
    pub points: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NumericScoringConfig {
    pub brackets: Vec<GraduatedBracket>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MultiSelectScoringConfig {
    pub per_correct: f32,
    pub per_incorrect: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MultipleChoiceScoringConfig {
    pub correct: f32,
    pub incorrect: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GameConfig {
    pub title: String,
    pub puppy_name: String,
    pub puppy_image: String,
    pub rounds: Vec<RoundConfig>,
}

impl GameConfig {
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let config_str = fs::read_to_string(path)?;
        let config: GameConfig = serde_json::from_str(&config_str)?;
        Ok(config)
    }
}
