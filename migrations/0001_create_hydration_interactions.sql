CREATE TABLE hydration_interactions (
  interaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX hydration_interactions_expires_at
  ON hydration_interactions (expires_at);
