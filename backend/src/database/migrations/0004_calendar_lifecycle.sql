-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Keep calendar revisions consistent for citizen, manager and account commands (C3, T3).
CREATE FUNCTION update_booking_calendar_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.starts_at, NEW.ends_at, NEW.status, NEW.facility_id)
    IS DISTINCT FROM (OLD.starts_at, OLD.ends_at, OLD.status, OLD.facility_id) THEN
    NEW.sequence := OLD.sequence + 1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER booking_calendar_sequence BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_calendar_sequence();

-- Revocation happens at account deletion; retention must also be able to purge old users (T4).
ALTER TABLE calendar_feeds DROP CONSTRAINT calendar_feeds_tenant_id_user_id_fkey;
ALTER TABLE calendar_feeds ADD CONSTRAINT calendar_feeds_tenant_id_user_id_fkey
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE;
