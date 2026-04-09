-- Add UPDATE policy for exercises table
-- This allows authenticated users (professionals) to update exercise details including video_url

DROP POLICY IF EXISTS "Authenticated users can update exercises" ON exercises;

CREATE POLICY "Authenticated users can update exercises" ON exercises
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
