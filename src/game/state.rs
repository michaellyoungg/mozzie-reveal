use std::collections::HashMap;
use std::sync::Arc;

use crate::types::*;

pub struct GameState {
    players: HashMap<String, Player>,
    current_round: Option<usize>,
    round_active: bool,
    config: Arc<GameConfig>,
    last_round_results: Option<RoundEndedSnapshot>,
}

impl GameState {
    pub fn new(config: Arc<GameConfig>) -> Self {
        Self {
            players: HashMap::new(),
            current_round: None,
            round_active: false,
            config,
            last_round_results: None,
        }
    }

    pub fn add_player(&mut self, id: String, name: String) {
        self.players.insert(id, Player::new(name));
    }

    pub fn reconnect_player(&mut self, id: &str) -> Option<String> {
        self.players.get_mut(id).map(|player| {
            player.online = true;
            player.name.clone()
        })
    }

    pub fn disconnect_player(&mut self, id: &str) -> Option<String> {
        self.players.get_mut(id).map(|player| {
            player.online = false;
            player.name.clone()
        })
    }

    pub fn player_count(&self) -> usize {
        self.players.len()
    }

    pub fn reset(&mut self) {
        self.current_round = None;
        self.round_active = false;
        self.last_round_results = None;
        self.players.clear();
    }

    pub fn start_round(&mut self) {
        if self.current_round.is_none() {
            self.current_round = Some(0);
        }
        self.round_active = true;
        self.last_round_results = None;
        self.clear_guesses();
    }

    pub fn next_round(&mut self) -> bool {
        if let Some(current) = self.current_round {
            if current + 1 < self.config.rounds.len() {
                self.current_round = Some(current + 1);
                self.round_active = true;
                self.last_round_results = None;
                self.clear_guesses();
                return true;
            }
        }
        false
    }

    pub fn submit_guess(&mut self, player_id: &str, guess: GuessData) {
        if let Some(player) = self.players.get_mut(player_id) {
            player.current_guess = Some(guess);
        }
    }

    pub fn get_player_name(&self, player_id: &str) -> Option<&str> {
        self.players.get(player_id).map(|p| p.name.as_str())
    }

    pub fn get_player_info(&self) -> Vec<PlayerInfo> {
        self.players.values().map(|p| p.to_info()).collect()
    }

    pub fn current_round_number(&self) -> Option<usize> {
        self.current_round
    }

    pub fn is_round_active(&self) -> bool {
        self.round_active
    }

    pub fn config_title(&self) -> &str {
        &self.config.title
    }

    pub fn config_puppy_name(&self) -> &str {
        &self.config.puppy_name
    }

    pub fn config_puppy_image(&self) -> &str {
        &self.config.puppy_image
    }

    pub fn total_rounds(&self) -> usize {
        self.config.rounds.len()
    }

    pub fn reveal_answer(&mut self) -> Vec<PlayerResult> {
        let mut results = Vec::new();

        if let Some(round_idx) = self.current_round {
            let round = &self.config.rounds[round_idx];

            // Collect player data to avoid borrowing issues
            let player_data: Vec<(String, String, Option<GuessData>)> = self
                .players
                .iter()
                .map(|(id, p)| (id.clone(), p.name.clone(), p.current_guess.clone()))
                .collect();

            for (player_id, player_name, guess_opt) in player_data {
                if let Some(guess) = guess_opt {
                    let (points_earned, details) = self.score_guess(round, &guess);

                    if let Some(player) = self.players.get_mut(&player_id) {
                        player.score += points_earned;

                        results.push(PlayerResult {
                            name: player_name,
                            guess,
                            points_earned,
                            total_score: player.score,
                            details,
                        });
                    }
                }
            }
        }

        self.round_active = false;

        if let Some(round_idx) = self.current_round {
            if let Some(correct_answer) = self.get_correct_answer() {
                self.last_round_results = Some(RoundEndedSnapshot {
                    round_number: round_idx,
                    results: results.clone(),
                    correct_answer,
                });
            }
        }

        results
    }

    pub fn last_round_results(&self) -> Option<&RoundEndedSnapshot> {
        self.last_round_results.as_ref()
    }

    pub fn get_current_round_data(&self) -> Option<RoundData> {
        let round_idx = self.current_round?;
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
    }

    pub fn get_correct_answer(&self) -> Option<CorrectAnswer> {
        let round_idx = self.current_round?;
        let round = &self.config.rounds[round_idx];

        match round {
            RoundConfig::BreedPercentage { actual_breeds, .. } => {
                Some(CorrectAnswer::BreedPercentage {
                    breeds: actual_breeds
                        .iter()
                        .map(|b| BreedGuess {
                            name: b.name.clone(),
                            percentage: b.percentage,
                        })
                        .collect(),
                })
            }
            RoundConfig::NumericGuess { correct_answer, .. } => {
                Some(CorrectAnswer::Numeric {
                    value: *correct_answer,
                })
            }
            RoundConfig::MultiSelect {
                correct_answers, ..
            } => Some(CorrectAnswer::MultiSelect {
                selections: correct_answers.clone(),
            }),
            RoundConfig::MultipleChoice {
                correct_answer, ..
            } => Some(CorrectAnswer::MultipleChoice {
                selection: correct_answer.clone(),
            }),
        }
    }

    // Private helper methods

    fn clear_guesses(&mut self) {
        for player in self.players.values_mut() {
            player.current_guess = None;
        }
    }

    fn score_guess(&self, round: &RoundConfig, guess: &GuessData) -> (f32, String) {
        match (round, guess) {
            (
                RoundConfig::BreedPercentage {
                    actual_breeds,
                    scoring,
                    ..
                },
                GuessData::BreedPercentage { guesses },
            ) => {
                let (pts, correct_breeds) =
                    self.calculate_breed_score(guesses, actual_breeds, scoring.percentage_accuracy_bonus);
                let details = format!(
                    "Correct breeds: {}",
                    if correct_breeds.is_empty() {
                        "None".to_string()
                    } else {
                        correct_breeds.join(", ")
                    }
                );
                (pts, details)
            }
            (
                RoundConfig::NumericGuess {
                    correct_answer,
                    scoring,
                    ..
                },
                GuessData::Numeric { value },
            ) => {
                let pts = self.calculate_numeric_score(*value, *correct_answer, &scoring.brackets);
                let diff = (value - correct_answer).abs();
                let details = format!("Off by {:.1}", diff);
                (pts, details)
            }
            (
                RoundConfig::MultiSelect {
                    correct_answers,
                    scoring,
                    ..
                },
                GuessData::MultiSelect { selections },
            ) => {
                let (pts, correct_sels, incorrect_sels) = self.calculate_multi_select_score(
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
                (pts, details)
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
                (pts, details)
            }
            _ => (0.0, "Type mismatch".to_string()),
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
}
