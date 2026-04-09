-- Add unique constraint to students_personals to prevent duplicate links
-- First, we need to clean up duplicates. We'll keep the oldest one.

WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY student_id, personal_id 
           ORDER BY created_at ASC
         ) as row_num
  FROM students_personals
)
DELETE FROM students_personals
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Now add the constraint
ALTER TABLE students_personals
ADD CONSTRAINT students_personals_student_personal_unique UNIQUE (student_id, personal_id);
