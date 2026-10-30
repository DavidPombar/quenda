-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Sports catalogue additions (#26): each sport names the illustration and colour of its facilities,
-- and the initial list gains badminton, 7-a-side football and the multi-sport court.
ALTER TABLE sports ADD COLUMN IF NOT EXISTS art text NOT NULL DEFAULT 'generic';
ALTER TABLE sports DROP CONSTRAINT IF EXISTS sports_art_check;
ALTER TABLE sports ADD CONSTRAINT sports_art_check
  CHECK (art IN ('padel', 'tennis', 'futsal', 'swimming', 'generic'));
UPDATE sports SET art = code WHERE code IN ('padel', 'tennis', 'futsal', 'swimming') AND art = 'generic';
CREATE OR REPLACE FUNCTION add_base_sports(municipality uuid) RETURNS void AS $$
  INSERT INTO sports (tenant_id, code, name_gl, name_es, cnid_class, cnid_type, schema_type, art, hidden, position)
  SELECT municipality, s.code, s.name_gl, s.name_es, s.cnid_class, s.cnid_type, s.schema_type, s.art, s.hidden, s.position
  FROM (VALUES
    ('padel', 'Pádel', 'Pádel', 'Pistas', 'Pista de pádel', 'SportsActivityLocation', 'padel', false, 1),
    ('tennis', 'Tenis', 'Tenis', 'Pistas', 'Pista de tenis', 'TennisComplex', 'tennis', false, 2),
    ('futsal', 'Fútbol sala', 'Fútbol sala', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'futsal', false, 3),
    ('swimming', 'Natación', 'Natación', 'Vasos de piscina', 'Vaso de piscina cubierta', 'PublicSwimmingPool', 'swimming', false, 4),
    ('basketball', 'Baloncesto', 'Baloncesto', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', true, 5),
    ('handball', 'Balonmán', 'Balonmano', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', true, 6),
    ('volleyball', 'Voleibol', 'Voleibol', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', true, 7),
    ('badminton', 'Bádminton', 'Bádminton', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', true, 8),
    ('football', 'Fútbol', 'Fútbol', 'Campos', 'Campo de fútbol', 'StadiumOrArena', 'generic', true, 9),
    ('football-7', 'Fútbol 7', 'Fútbol 7', 'Campos', 'Campo de fútbol 7', 'StadiumOrArena', 'generic', true, 10),
    ('athletics', 'Atletismo', 'Atletismo', 'Pistas de atletismo', 'Pista de atletismo', 'StadiumOrArena', 'generic', true, 11),
    ('fronton', 'Frontón', 'Frontón', 'Frontones', 'Frontón', 'SportsActivityLocation', 'generic', true, 12),
    ('squash', 'Squash', 'Squash', 'Salas', 'Sala de squash', 'SportsActivityLocation', 'generic', true, 13),
    ('fitness', 'Ximnasio', 'Gimnasio', 'Salas', 'Sala de musculación', 'ExerciseGym', 'generic', true, 14),
    ('multisport', 'Pista polideportiva', 'Pista polideportiva', 'Pistas', 'Pista polideportiva', 'SportsActivityLocation', 'generic', true, 15)
  ) AS s(code, name_gl, name_es, cnid_class, cnid_type, schema_type, art, hidden, position)
  ON CONFLICT DO NOTHING;
$$ LANGUAGE sql;
-- Existing municipalities get the new entries, hidden; what they already edited is kept.
SELECT add_base_sports(id) FROM municipalities;
