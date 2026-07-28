BEGIN;

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE "user"
SET public_id =
  'SBIE-' ||
  TO_CHAR(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY') ||
  '-' ||
  CASE
    WHEN id < 1000 THEN LPAD(id::text, 3, '0')
    ELSE id::text
  END
WHERE role = 'fellow'
  AND public_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_public_id_unique
  ON "user" (public_id)
  WHERE public_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_user_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'fellow' AND NEW.public_id IS NULL THEN
    NEW.public_id :=
      'SBIE-' ||
      TO_CHAR(NEW.created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY') ||
      '-' ||
      CASE
        WHEN NEW.id < 1000 THEN LPAD(NEW.id::text, 3, '0')
        ELSE NEW.id::text
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_user_public_id ON "user";

CREATE TRIGGER trg_set_user_public_id
BEFORE INSERT OR UPDATE OF role, public_id ON "user"
FOR EACH ROW
EXECUTE FUNCTION set_user_public_id();

COMMIT;
