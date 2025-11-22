-- Fix Profiles RLS to ensure Personals can see Students
-- Usually profiles should be readable by authenticated users, or at least by linked users.

-- 1. Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Allow Personals to view profiles of students they are linked to
DROP POLICY IF EXISTS "Personals can view linked students" ON profiles;
CREATE POLICY "Personals can view linked students" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students_personals sp 
    WHERE sp.student_id = profiles.id 
    AND sp.personal_id = auth.uid()
  )
);

-- 4. Allow Students to view profiles of personals they are linked to
DROP POLICY IF EXISTS "Students can view linked personals" ON profiles;
CREATE POLICY "Students can view linked personals" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students_personals sp 
    WHERE sp.personal_id = profiles.id 
    AND sp.student_id = auth.uid()
  )
);

-- 5. Allow public read of basic info (optional, but helpful for invites/search)
-- If you want to be strict, skip this. But often it helps.
-- CREATE POLICY "Public profiles are viewable by everyone" 
-- ON profiles FOR SELECT 
-- USING (true);
