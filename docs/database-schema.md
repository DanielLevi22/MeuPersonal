# 🗄️ Database Schema - MeuPersonal (Updated 2025-11-29)

## Overview

Complete database schema after restructuring with semantic DDD naming in English.

---

## 📊 Core Tables

### **profiles** (Identity & Access)
Central table for all users (professionals, students, admins).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  account_type TEXT NOT NULL, -- 'professional' | 'managed_student' | 'autonomous_student' | 'admin'
  account_status TEXT, -- 'pending' | 'active' | 'rejected' | 'suspended'
  
  -- Student fields (consolidated from old 'students' table)
  weight NUMERIC,
  height NUMERIC,
  birth_date DATE,
  gender TEXT,
  notes TEXT,
  
  -- Professional fields
  professional_name TEXT,
  professional_bio TEXT,
  cref TEXT, -- Personal trainer registration
  crn TEXT,  -- Nutritionist registration
  is_verified BOOLEAN DEFAULT false,
  
  -- Subscription (for autonomous students)
  subscription_tier TEXT,
  subscription_status TEXT,
  
  -- Gamification
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤝 Coaching Context

### **coachings** (renamed from `client_professional_relationships`)
Manages relationships between professionals and students.

```sql
CREATE TABLE coachings (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES profiles(id),
  service_type TEXT NOT NULL, -- 'personal_training' | 'nutrition_consulting'
  status TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'paused' | 'ended'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ended_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💪 Training Context

### **training_periodizations** (renamed from `periodizations`)
Long-term training plans.

```sql
CREATE TABLE training_periodizations (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  objective TEXT, -- 'hypertrophy' | 'weight_loss' | 'conditioning'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft' | 'active' | 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **training_plans**
Weekly/monthly training plans within a periodization.

```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY,
  periodization_id UUID REFERENCES training_periodizations(id),
  name TEXT NOT NULL,
  training_split TEXT, -- 'abc' | 'abcd' | 'upper_lower' | 'push_pull_legs'
  weekly_frequency INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **workouts**
Individual workout sessions.

```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  training_plan_id UUID REFERENCES training_plans(id),
  professional_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **workout_exercises** (renamed from `workout_items`)
Exercises within a workout.

```sql
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id),
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER,
  sets INTEGER,
  reps TEXT, -- Can be range like "8-12"
  rest_seconds INTEGER,
  notes TEXT
);
```

### **workout_executions** (renamed from `workout_sessions`)
Records of completed workouts.

```sql
CREATE TABLE workout_executions (
  id UUID PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id),
  student_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **executed_sets** (renamed from `workout_set_logs`)
Individual set records during workout execution.

```sql
CREATE TABLE executed_sets (
  id UUID PRIMARY KEY,
  workout_execution_id UUID REFERENCES workout_executions(id), -- renamed from workout_log_id
  workout_exercise_id UUID REFERENCES workout_exercises(id),
  set_number INTEGER,
  reps_completed INTEGER,
  weight_kg NUMERIC,
  rpe INTEGER, -- Rate of Perceived Exertion (1-10)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🍎 Nutrition Context

### **nutrition_plans** (renamed from `diet_plans`)
Nutrition/diet plans for students.

```sql
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  plan_type TEXT, -- 'unique' | 'cyclic'
  start_date DATE,
  end_date DATE,
  target_calories INTEGER,
  target_protein INTEGER,
```sql
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  meal_id UUID REFERENCES meals(id),
  logged_date DATE,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎮 Gamification Context

### **daily_goals**
Daily goals for students.

```sql
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  goal_date DATE NOT NULL,
  goal_type TEXT, -- 'workout' | 'nutrition' | 'water' | 'steps'
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **achievements**
Unlocked achievements.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  achievement_key TEXT NOT NULL,
  achievement_type TEXT, -- 'bronze' | 'silver' | 'gold' | 'platinum'
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **streaks** (renamed from `student_streaks`)
Consecutive days streaks.

```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  streak_type TEXT, -- 'workout' | 'nutrition'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **ranking_scores** (renamed from `leaderboard_scores`)
Leaderboard/ranking scores.

```sql
CREATE TABLE ranking_scores (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  score INTEGER DEFAULT 0,
  rank INTEGER,
  period TEXT, -- 'weekly' | 'monthly' | 'all_time'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💬 Communication Context

### **conversations**
Chat conversations between professionals and students.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  professional_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, student_id)
);
```

### **messages** (renamed from `chat_messages`)
Individual chat messages.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text' | 'image' | 'audio' | 'file'
  media_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Supporting Tables

### **exercises**
Exercise library.

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  muscle_group TEXT,
  equipment TEXT,
  difficulty TEXT,
  video_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **foods**
Food/ingredient library.

```sql
CREATE TABLE foods (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  serving_size NUMERIC,
  serving_unit TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Summary of Changes

### **Removed Tables:**
- ❌ `students` (consolidated into `profiles`)
- ❌ `students_personals` (duplicate of `coachings`)
- ❌ `relationship_transfers` (over-engineering)

### **Renamed Tables:**
- ✅ `client_professional_relationships` → `coachings`
- ✅ `periodizations` → `training_periodizations`
- ✅ `workout_sessions` → `workout_executions`
- ✅ `workout_set_logs` → `executed_sets`
- ✅ `workout_items` → `workout_exercises`
- ✅ `diet_plans` → `nutrition_plans`
- ✅ `diet_meal_items` → `meal_foods`
- ✅ `diet_logs` → `meal_logs`
- ✅ `student_streaks` → `streaks`
- ✅ `leaderboard_scores` → `ranking_scores`
- ✅ `chat_messages` → `messages`

### **Column Renames:**
- ✅ `coachings.relationship_status` → `status`
- ✅ `coachings.service_category` → `service_type`
- ✅ `executed_sets.workout_log_id` → `workout_execution_id`

---

## 🎯 Benefits

1. **Semantic Clarity**: Table names reflect domain concepts
2. **Reduced Redundancy**: No duplicate tables
3. **Better Performance**: Fewer JOINs needed
4. **Easier Maintenance**: Clear, consistent naming
5. **DDD Alignment**: Follows Domain-Driven Design principles
