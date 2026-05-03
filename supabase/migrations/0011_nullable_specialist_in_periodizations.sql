-- Allow autonomous student plans (no specialist)
ALTER TABLE training_periodizations
  ALTER COLUMN specialist_id DROP NOT NULL;
