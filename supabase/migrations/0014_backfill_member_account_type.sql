-- Backfill: students who self-registered but got account_type = 'student' (bug in register route)
-- should be account_type = 'member' (autonomous student, no specialist link).
--
-- Safety: specialist-invited students always have at least one row in student_specialists.
-- Self-registered students have none — that's the discriminator.

UPDATE profiles
SET account_type = 'member'
WHERE account_type = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM student_specialists ss
    WHERE ss.student_id = profiles.id
  );
