-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Sports catalogue per municipality (C1, M1, #26). Each municipality starts from the same list,
-- aligned with the CNID (Censo Nacional de Instalaciones Deportivas, CSD 2005) and schema.org,
-- and edits its own copy: add, hide, rename in Galician and Spanish.
CREATE TABLE sports (
  tenant_id uuid NOT NULL REFERENCES municipalities(id),
  code text NOT NULL CHECK (code ~ '^[a-z0-9-]{2,40}$'),
  name_gl text NOT NULL CHECK (length(btrim(name_gl)) BETWEEN 1 AND 80),
  name_es text NOT NULL CHECK (length(btrim(name_es)) BETWEEN 1 AND 80),
  -- CNID group of conventional sports spaces and space type; the census publishes names, not codes.
  cnid_class text NOT NULL,
  cnid_type text NOT NULL,
  schema_type text NOT NULL CHECK (schema_type ~ '^[A-Z][A-Za-z]+$'),
  -- Illustration and colour used for its facilities; other sports use the generic ones.
  art text NOT NULL DEFAULT 'generic' CHECK (art IN ('padel','tennis','futsal','swimming','generic')),
  visible boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, code)
);
-- The initial list. Changing it later takes a new migration that replaces this function;
-- municipalities that already exist keep their own copy.
CREATE FUNCTION add_default_sports(tenant uuid) RETURNS void LANGUAGE sql AS $$
  INSERT INTO sports (tenant_id, code, name_gl, name_es, cnid_class, cnid_type, schema_type, art, position)
  SELECT tenant, code, name_gl, name_es, cnid_class, cnid_type, schema_type, art, position
  FROM (VALUES
    ('padel', 'Pádel', 'Pádel', 'Pistas', 'Pista de pádel', 'SportsActivityLocation', 'padel', 0),
    ('tennis', 'Tenis', 'Tenis', 'Pistas', 'Pista de tenis', 'TennisComplex', 'tennis', 1),
    ('futsal', 'Fútbol sala', 'Fútbol sala', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'futsal', 2),
    ('swimming', 'Natación', 'Natación', 'Vasos de piscina', 'Vaso de piscina cubierta', 'PublicSwimmingPool', 'swimming', 3),
    ('basketball', 'Baloncesto', 'Baloncesto', 'Pistas', 'Pista polideportiva', 'SportsActivityLocation', 'generic', 4),
    ('volleyball', 'Voleibol', 'Voleibol', 'Pistas', 'Pista polideportiva', 'SportsActivityLocation', 'generic', 5),
    ('handball', 'Balonmán', 'Balonmano', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', 6),
    ('badminton', 'Bádminton', 'Bádminton', 'Pabellones', 'Pabellón polideportivo', 'SportsActivityLocation', 'generic', 7),
    ('football', 'Fútbol', 'Fútbol', 'Campos', 'Campo de fútbol', 'StadiumOrArena', 'generic', 8),
    ('football-7', 'Fútbol 7', 'Fútbol 7', 'Campos', 'Campo de fútbol 7', 'StadiumOrArena', 'generic', 9),
    ('athletics', 'Atletismo', 'Atletismo', 'Pistas', 'Pista de atletismo', 'StadiumOrArena', 'generic', 10),
    ('fronton', 'Frontón', 'Frontón', 'Frontones', 'Frontón', 'SportsActivityLocation', 'generic', 11),
    ('squash', 'Squash', 'Squash', 'Salas', 'Sala de squash', 'SportsActivityLocation', 'generic', 12),
    ('fitness', 'Ximnasio', 'Gimnasio', 'Salas', 'Sala de musculación', 'ExerciseGym', 'generic', 13),
    ('multisport', 'Pista polideportiva', 'Pista polideportiva', 'Pistas', 'Pista polideportiva', 'SportsActivityLocation', 'generic', 14)
  ) AS list (code, name_gl, name_es, cnid_class, cnid_type, schema_type, art, position)
  ON CONFLICT (tenant_id, code) DO NOTHING;
$$;
SELECT add_default_sports(id) FROM municipalities;
-- Every new municipality (setup, operator, import, tests) starts with the list.
CREATE FUNCTION municipality_default_sports() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM add_default_sports(NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER municipality_default_sports AFTER INSERT ON municipalities
  FOR EACH ROW EXECUTE FUNCTION municipality_default_sports();
-- Facilities point at a sport of their own municipality instead of the fixed V0 list.
DO $$
DECLARE name text;
BEGIN
  FOR name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'facilities'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%sport%'
  LOOP
    EXECUTE format('ALTER TABLE facilities DROP CONSTRAINT %I', name);
  END LOOP;
END $$;
ALTER TABLE facilities ADD CONSTRAINT facilities_sport_fk
  FOREIGN KEY (tenant_id, sport) REFERENCES sports(tenant_id, code);
-- Clubs (#17) name their sport from the same catalogue.
DO $$
DECLARE name text;
BEGIN
  FOR name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'organizations'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%sport%'
  LOOP
    EXECUTE format('ALTER TABLE organizations DROP CONSTRAINT %I', name);
  END LOOP;
END $$;
ALTER TABLE organizations ADD CONSTRAINT organizations_sport_fk
  FOREIGN KEY (tenant_id, sport) REFERENCES sports(tenant_id, code);
