-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Facility catalogue (#26): a sports catalogue per municipality instead of a fixed list of four,
-- and facility photos with required alternative text.
CREATE TABLE IF NOT EXISTS sports (
  tenant_id uuid NOT NULL REFERENCES municipalities(id),
  code text NOT NULL CHECK (code ~ '^[a-z0-9-]{2,40}$'),
  name_gl text NOT NULL CHECK (length(name_gl) BETWEEN 2 AND 60),
  name_es text NOT NULL CHECK (length(name_es) BETWEEN 2 AND 60),
  -- CNID (Censo Nacional de Instalaciones Deportivas) group and space type, and schema.org type.
  cnid_class text NOT NULL CHECK (length(cnid_class) BETWEEN 1 AND 80),
  cnid_type text NOT NULL CHECK (length(cnid_type) BETWEEN 1 AND 80),
  schema_type text NOT NULL CHECK (schema_type ~ '^[A-Z][A-Za-z]{0,59}$'),
  -- Hidden sports are not offered in filters or for new facilities; facilities using them keep them.
  hidden boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, code)
);
-- Initial catalogue, aligned with the CNID taxonomy. The four sports of V0 start visible and the
-- rest hidden, ready for each municipality to show, rename or extend.
CREATE OR REPLACE FUNCTION add_base_sports(municipality uuid) RETURNS void AS $$
  INSERT INTO sports (tenant_id, code, name_gl, name_es, cnid_class, cnid_type, schema_type, hidden, position)
  SELECT municipality, s.code, s.name_gl, s.name_es, s.cnid_class, s.cnid_type, s.schema_type, s.hidden, s.position
  FROM (VALUES
    ('padel', 'Pádel', 'Pádel', 'Pistas', 'Pista de pádel', 'SportsActivityLocation', false, 1),
    ('tennis', 'Tenis', 'Tenis', 'Pistas', 'Pista de tenis', 'TennisComplex', false, 2),
    ('futsal', 'Fútbol sala', 'Fútbol sala', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', false, 3),
    ('swimming', 'Natación', 'Natación', 'Vasos de piscina', 'Vaso de piscina cubierta', 'PublicSwimmingPool', false, 4),
    ('basketball', 'Baloncesto', 'Baloncesto', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', true, 5),
    ('handball', 'Balonmán', 'Balonmano', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', true, 6),
    ('volleyball', 'Voleibol', 'Voleibol', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', true, 7),
    ('football', 'Fútbol', 'Fútbol', 'Campos', 'Campo de fútbol', 'StadiumOrArena', true, 8),
    ('athletics', 'Atletismo', 'Atletismo', 'Pistas de atletismo', 'Pista de atletismo', 'StadiumOrArena', true, 9),
    ('fronton', 'Frontón', 'Frontón', 'Frontones', 'Frontón', 'SportsActivityLocation', true, 10),
    ('squash', 'Squash', 'Squash', 'Salas', 'Sala de squash', 'SportsActivityLocation', true, 11),
    ('fitness', 'Ximnasio', 'Gimnasio', 'Salas', 'Sala de musculación', 'ExerciseGym', true, 12)
  ) AS s(code, name_gl, name_es, cnid_class, cnid_type, schema_type, hidden, position)
  ON CONFLICT DO NOTHING;
$$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION seed_municipality_sports() RETURNS trigger AS $$
BEGIN
  PERFORM add_base_sports(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS municipalities_seed_sports ON municipalities;
CREATE TRIGGER municipalities_seed_sports AFTER INSERT ON municipalities
  FOR EACH ROW EXECUTE FUNCTION seed_municipality_sports();
SELECT add_base_sports(id) FROM municipalities;
-- The fixed CHECKs give way to the catalogue.
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_sport_check;
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_sport_fk;
ALTER TABLE facilities ADD CONSTRAINT facilities_sport_fk
  FOREIGN KEY (tenant_id, sport) REFERENCES sports(tenant_id, code);
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_sport_check;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_sport_fk;
ALTER TABLE organizations ADD CONSTRAINT organizations_sport_fk
  FOREIGN KEY (tenant_id, sport) REFERENCES sports(tenant_id, code);
-- Photos live in the database like the municipal logo, so backups and exports carry them.
CREATE TABLE IF NOT EXISTS facility_photos (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, facility_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 4194304),
  sha256 text NOT NULL,
  -- Alternative text is required (accessibility); Spanish falls back to Galician when empty.
  alt_gl text NOT NULL CHECK (length(alt_gl) BETWEEN 1 AND 250),
  alt_es text NOT NULL DEFAULT '' CHECK (length(alt_es) <= 250),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS facility_photos_facility ON facility_photos(tenant_id, facility_id, position);
