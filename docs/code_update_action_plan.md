# 📋 Code Update Action Plan - Database Restructuring

## Overview

After completing database restructuring (Phases 1 & 2), we need to update all code references to use the new table names and structure.

---

## 🎯 Changes Summary

### **Tables Consolidated:**
- ❌ `students` → ✅ Merged into `profiles`

### **Tables Renamed:**
| Old Name | New Name |
|----------|----------|
| `client_professional_relationships` | `coachings` |
| `periodizations` | `training_periodizations` |
| `workout_sessions` | `workout_executions` |
| `workout_set_logs` | `executed_sets` |
| `workout_items` | `workout_exercises` |
| `diet_plans` | `nutrition_plans` |
| `diet_meal_items` | `meal_foods` |
| `diet_logs` | `meal_logs` |
| `student_streaks` | `streaks` |
| `leaderboard_scores` | `ranking_scores` |
| `chat_messages` | `messages` |

### **Columns Renamed:**
- `coachings.relationship_status` → `coachings.status`
- `coachings.service_category` → `coachings.service_type`
- `executed_sets.workout_log_id` → `executed_sets.workout_execution_id`

---

## 📦 Phase 1: Update Shared Types

### Step 1.1: Update `packages/supabase/src/types.ts`

**Changes:**
```typescript
// Remove Student interface (consolidated into Profile)
- export interface Student { ... }

// Update Profile interface to include student fields
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  account_type: 'professional' | 'managed_student' | 'autonomous_student' | 'admin';
  
  // Student fields (NEW)
  weight?: number;
  height?: number;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  
  // Professional fields
  professional_name?: string;
  cref?: string;
  crn?: string;
  // ... rest
}

// Rename interfaces
- ClientProfessionalRelationship → Coaching
- Periodization → TrainingPeriodization
- WorkoutSession → WorkoutExecution
- WorkoutSetLog → ExecutedSet
- DietPlan → NutritionPlan
- StudentStreak → Streak
- LeaderboardScore → RankingScore
- ChatMessage → Message
```

---

## 📱 Phase 2: Update Mobile App

### Search & Replace Patterns:
- `from('students')` → `from('profiles').eq('account_type', 'managed_student')`
- `from('client_professional_relationships')` → `from('coachings')`
- `from('periodizations')` → `from('training_periodizations')`
- `from('workout_sessions')` → `from('workout_executions')`
- `from('workout_set_logs')` → `from('executed_sets')`
- `from('diet_plans')` → `from('nutrition_plans')`
- `from('student_streaks')` → `from('streaks')`
- `from('chat_messages')` → `from('messages')`

---

## 🌐 Phase 3: Update Web App

Same patterns as mobile app.

---

## ✅ Phase 4: Testing

- [ ] Unit tests
- [ ] Integration tests  
- [ ] Manual testing

---

## 🚀 Execution Order

1. Update `packages/supabase/src/types.ts`
2. Update mobile stores & hooks
3. Update web hooks & pages
4. Run tests
5. Deploy

---

## 🔍 Search Commands

```bash
grep -r "from('students')" apps/
grep -r "from('client_professional_relationships')" apps/
grep -r "from('periodizations')" apps/
grep -r "from('workout_sessions')" apps/
grep -r "from('diet_plans')" apps/
```
