-- Add full-text search vector to foods table
-- Uses Portuguese + English dictionaries to cover both languages in food names

ALTER TABLE "foods"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Populate existing rows
UPDATE "foods"
SET "search_vector" = to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(category, ''))
WHERE "search_vector" IS NULL;

-- GIN index for fast FTS queries
CREATE INDEX IF NOT EXISTS "foods_search_vector_idx" ON "foods" USING GIN ("search_vector");

-- Trigger function to keep search_vector in sync
CREATE OR REPLACE FUNCTION foods_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'portuguese',
    coalesce(NEW.name, '') || ' ' || coalesce(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER foods_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, category
  ON "foods"
  FOR EACH ROW
  EXECUTE FUNCTION foods_search_vector_update();
