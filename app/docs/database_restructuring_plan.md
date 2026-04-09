# 🎯 Implementation Plan: Database Semantic Restructuring

## Goal
Consolidate redundant tables and apply DDD semantic naming in English to improve maintainability and domain clarity.

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes**: This restructuring will require updates to all application code that queries the database.

> [!WARNING]
> **Data Migration**: All existing data will be migrated. A complete backup is required before proceeding.

**Key Decisions Needed:**
1. Should we keep `profiles` or rename to `people`?
2. Should we create separate `professionals` and `students` tables or keep everything in one table with a `type` column?
3. Timeline for implementation - can we do this incrementally or need it all at once?

---

## Proposed Changes

### 🗂️ Core Identity Tables

#### [MODIFY] [profiles](file:///c:/meupersonal/packages/supabase/migrations/20241124_multi_role_access_system.sql#L24-L30)

**Current Structure:**
```sql
profiles (
  id, email, full_name, account_type, subscription_tier,
  professional_name, cref, crn, is_verified
)
```

**Proposed Changes:**
1. **Add student-specific fields** (consolidating from `students` table)
2. **Option A**: Keep as single table with type discrimination
3. **Option B**: Split into `people` (base) + `professionals` + `students`

**Recommendation**: Option A (simpler migration, less joins)

```sql
-- Add student fields to profiles
ALTER TABLE profiles
  ADD COLUMN weight NUMERIC,
  ADD COLUMN height NUMERIC,
  ADD COLUMN birth_date DATE,
  ADD COLUMN gender TEXT,
  ADD COLUMN notes TEXT;
```

---

#### [DELETE] [students](file:///c:/meupersonal/packages/supabase/migrations/20241124_multi_role_access_system.sql#L32-L45)

**Reason**: Redundant with `profiles`. All data will be migrated to `profiles`.

**Migration Strategy**:
```sql
-- 1. Migrate data
UPDATE profiles p
SET 
  weight = s.weight,
  height = s.height,
  birth_date = s.birth_date,
  gender = s.gender,
  notes = s.notes
FROM students s
WHERE p.id = s.id;

-- 2. Update foreign keys
ALTER TABLE periodizations 
  DROP CONSTRAINT IF EXISTS periodizations_student_id_fkey,
  ADD CONSTRAINT periodizations_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES profiles(id);

-- 3. Drop table
DROP TABLE students CASCADE;
```

---

#### [DELETE] students_personals

**Reason**: Duplicate of `client_professional_relationships`.

**Migration Strategy**:
```sql
-- Verify no unique data
SELECT * FROM students_personals sp
WHERE NOT EXISTS (
  SELECT 1 FROM client_professional_relationships cpr
  WHERE cpr.client_id = sp.student_id 
    AND cpr.professional_id = sp.personal_id
);

-- Drop if empty
DROP TABLE students_personals CASCADE;
```

---

### 🤝 Coaching Context

#### [MODIFY] client_professional_relationships → coachings

**Rationale**: "Coaching" is more semantic and shorter than "client_professional_relationships".

```sql
-- Rename table
ALTER TABLE client_professional_relationships RENAME TO coachings;

-- Rename columns for consistency
ALTER TABLE coachings 
  RENAME COLUMN relationship_status TO status;

ALTER TABLE coachings
  RENAME COLUMN service_category TO service_type;

-- Update indexes
ALTER INDEX idx_relationships_client RENAME TO idx_coachings_client;
ALTER INDEX idx_relationships_professional RENAME TO idx_coachings_professional;
ALTER INDEX idx_relationships_status RENAME TO idx_coachings_status;
```

---

### 💪 Training Context

#### [MODIFY] periodizations → training_periodizations

```sql
ALTER TABLE periodizations RENAME TO training_periodizations;

-- Update indexes
ALTER INDEX idx_periodizations_student RENAME TO idx_training_periodizations_student;
ALTER INDEX idx_periodizations_professional RENAME TO idx_training_periodizations_professional;
```

#### [MODIFY] workout_sessions → workout_executions

**Rationale**: "Execution" is clearer than "session" - it's the actual performance of a workout.

```sql
ALTER TABLE workout_sessions RENAME TO workout_executions;

-- Update indexes
ALTER INDEX idx_workout_sessions_student RENAME TO idx_workout_executions_student;
ALTER INDEX idx_workout_sessions_workout RENAME TO idx_workout_executions_workout;
```

#### [MODIFY] workout_set_logs → executed_sets

**Rationale**: More semantic - these are sets that were executed.

```sql
ALTER TABLE workout_set_logs RENAME TO executed_sets;

-- Update columns for clarity
ALTER TABLE executed_sets
  RENAME COLUMN workout_log_id TO workout_execution_id;
```

#### [MODIFY] workout_items → workout_exercises

**Rationale**: "Exercises" is more domain-specific than generic "items".

```sql
ALTER TABLE workout_items RENAME TO workout_exercises;
```

---

### 🍎 Nutrition Context

#### [MODIFY] diet_plans → nutrition_plans

**Rationale**: "Nutrition" is more comprehensive than "diet".

```sql
ALTER TABLE diet_plans RENAME TO nutrition_plans;

-- Update indexes
ALTER INDEX idx_diet_plans_student RENAME TO idx_nutrition_plans_student;
ALTER INDEX idx_diet_plans_professional RENAME TO idx_nutrition_plans_professional;
```

#### [MODIFY] diet_meal_items → meal_foods

**Rationale**: Simpler and more semantic.

```sql
ALTER TABLE diet_meal_items RENAME TO meal_foods;
```

#### [MODIFY] diet_logs → meal_logs

**Rationale**: More specific - logging meals, not entire diet.

```sql
ALTER TABLE diet_logs RENAME TO meal_logs;
```

---

### 🎮 Gamification Context

#### [MODIFY] student_streaks → streaks

**Rationale**: Simpler, and student context is clear from foreign key.

```sql
ALTER TABLE student_streaks RENAME TO streaks;
```

#### [MODIFY] leaderboard_scores → ranking_scores

**Rationale**: "Ranking" is more universal than "leaderboard".

```sql
ALTER TABLE leaderboard_scores RENAME TO ranking_scores;
```

---

### 💬 Communication Context

#### [MODIFY] chat_messages → messages

**Rationale**: "Chat" is redundant - messages are always in conversations.

```sql
ALTER TABLE chat_messages RENAME TO messages;

-- Update foreign key
ALTER TABLE messages
  RENAME COLUMN conversation_id TO conversation_id; -- Already correct
```

---

### 🗑️ Tables to Remove

#### [DELETE] relationship_transfers

**Reason**: Over-engineering. Transfers can be handled by updating `coachings` table.

```sql
-- Backup data if needed
CREATE TABLE relationship_transfers_backup AS 
SELECT * FROM relationship_transfers;

-- Drop table
DROP TABLE relationship_transfers CASCADE;
```

---

## Verification Plan

### Automated Tests

```sql
-- Test 1: Verify all students migrated to profiles
SELECT COUNT(*) FROM profiles WHERE account_type = 'managed_student';
-- Should match previous students count

-- Test 2: Verify foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('coachings', 'training_periodizations', 'nutrition_plans');

-- Test 3: Verify no orphaned records
SELECT 'training_periodizations' as table_name, COUNT(*) 
FROM training_periodizations tp
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = tp.student_id);
```

### Manual Verification

1. **Login Flow**: Test professional and student login
2. **Create Student**: Test creating new student
3. **Create Workout**: Test creating periodization and workout
4. **Create Diet**: Test creating nutrition plan
5. **Chat**: Test sending messages
6. **Gamification**: Test daily goals and achievements

---

## Rollback Plan

Each migration will include a rollback script:

```sql
-- Example: Rollback coachings rename
BEGIN;

ALTER TABLE coachings RENAME TO client_professional_relationships;
ALTER TABLE client_professional_relationships 
  RENAME COLUMN status TO relationship_status;
ALTER TABLE client_professional_relationships
  RENAME COLUMN service_type TO service_category;

COMMIT;
```

---

## Migration Order

**Critical**: Migrations must be executed in this order to avoid foreign key conflicts:

1. ✅ Add student fields to `profiles`
2. ✅ Migrate data from `students` to `profiles`
3. ✅ Update foreign keys pointing to `students`
4. ✅ Drop `students` table
5. ✅ Drop `students_personals` table
6. ✅ Drop `relationship_transfers` table
7. ✅ Rename `client_professional_relationships` → `coachings`
8. ✅ Rename training tables
9. ✅ Rename nutrition tables
10. ✅ Rename gamification tables
11. ✅ Rename communication tables

---

## Code Updates Required

### TypeScript Types

```typescript
// Before
interface Student {
  id: string;
  personal_id: string;
  email: string;
  // ...
}

// After - consolidated into Profile
interface Profile {
  id: string;
  email: string;
  account_type: 'professional' | 'managed_student' | 'autonomous_student';
  // Student fields
  weight?: number;
  height?: number;
  birth_date?: string;
  // Professional fields
  cref?: string;
  crn?: string;
}
```

### Supabase Queries

```typescript
// Before
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('personal_id', professionalId);

// After
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('account_type', 'managed_student')
  .in('id', (
    await supabase
      .from('coachings')
      .select('client_id')
      .eq('professional_id', professionalId)
      .eq('status', 'active')
  ).data.map(c => c.client_id));
```

---

## Timeline

### Week 1: Consolidation
- Day 1-2: Create and test consolidation migrations
- Day 3: Execute in staging
- Day 4-5: Update code for consolidated tables

### Week 2: Renaming
- Day 1-2: Create and test rename migrations
- Day 3: Execute in staging
- Day 4-5: Update all code references

### Week 3: Testing & Deploy
- Day 1-3: Comprehensive testing
- Day 4: Deploy to production
- Day 5: Monitor and fix issues

---

## Success Metrics

- ✅ Zero data loss
- ✅ All tests passing
- ✅ No increase in query time
- ✅ Code is more readable
- ✅ Easier onboarding for new developers
