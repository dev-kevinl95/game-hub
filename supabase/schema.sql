CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Otros',
  tags TEXT NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  banner_url TEXT,
  game_url TEXT NOT NULL,
  plays INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (name) VALUES
  ('Acción'),('Aventura'),('Arcade'),('Estrategia'),('Puzzle'),('Deportes'),('Otros')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_plays(game_id integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE games SET plays = plays + 1 WHERE id = game_id;
END;
$$;

CREATE OR REPLACE FUNCTION sync_sequences()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM setval(pg_get_serial_sequence('games', 'id'), GREATEST(COALESCE(MAX(id), 1), 1)) FROM games;
  PERFORM setval(pg_get_serial_sequence('posts', 'id'), GREATEST(COALESCE(MAX(id), 1), 1)) FROM posts;
  PERFORM setval(pg_get_serial_sequence('categories', 'id'), GREATEST(COALESCE(MAX(id), 1), 1)) FROM categories;
END;
$$;

GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.games TO service_role;
GRANT ALL ON TABLE public.posts TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;