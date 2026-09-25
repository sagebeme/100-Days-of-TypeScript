-- Every score ever submitted. The leaderboard is worked out from these.
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points >= 0),
  created_at TEXT NOT NULL
);

-- The leaderboard asks "best points in this game" all the time: an index makes that fast.
CREATE INDEX scores_game_points ON scores (game, points DESC);
