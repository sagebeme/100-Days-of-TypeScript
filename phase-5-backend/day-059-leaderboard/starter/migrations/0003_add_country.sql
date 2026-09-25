-- A later change: players can show a flag. Existing players get NULL.
ALTER TABLE players ADD COLUMN country TEXT CHECK (country IS NULL OR length(country) = 2);
