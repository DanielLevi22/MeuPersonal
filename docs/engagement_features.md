# Engagement & Retention Features Design

This document outlines the design and implementation strategy for advanced engagement features aimed at increasing user retention and focus.

## 1. 🏆 Ranking (Leaderboard)

### Concept
A weekly leaderboard where students compete for "Focus Points". The goal is to create healthy competition and encourage daily app usage.

### Mechanics
-   **Scope**:
    -   **Global**: All students in the platform (filtered by level/tier).
    -   **Personal**: Students managed by the same Personal Trainer.
-   **Scoring ("Focus Points")**:
    -   **Workout**: +100 points per completed workout.
    -   **Diet**: +10 points per meal logged (bonus +50 for hitting daily macro targets).
    -   **Streak**: +20 points per day of streak.
    -   **Hydration**: +5 points per liter (max 20/day).
-   **Reset**: Weekly (Sunday night).
-   **Rewards**: Top 3 get a special badge ("Champion of the Week") and extra XP.

### Technical Requirements
-   **Database**: `leaderboard_scores` table (student_id, week_start_date, points, breakdown).
-   **Backend**: Scheduled job (pg_cron) or Trigger to calculate points daily.
-   **UI**: `LeaderboardScreen` with top 3 podium visualization and list of others.

---

## 2. ⚡ Immersive "Live Workout" Mode

### Concept
Transform the workout execution screen into an immersive, guided experience that keeps the user focused and minimizes distractions.

### Mechanics
-   **Focus Mode**: Full screen, hidden tab bar, dimmed background elements.
-   **Auto-Timer**:
    -   When a user checks a set, the rest timer starts automatically in an overlay.
    -   "Skip Rest" button available.
-   **Audio Feedback**:
    -   Sound effects for: Set completion, Rest start, Rest finish (3s countdown), Workout finish.
    -   Text-to-Speech (optional): "Next exercise: Bench Press".
-   **Haptic Feedback**: Vibration on timer completion.
-   **Celebration**: Confetti animation and "Workout Summary" card upon completion.

### Technical Requirements
-   **State**: Enhanced `WorkoutSession` state management.
-   **Libraries**: `expo-av` (audio), `expo-haptics` (vibration).
-   **UI**: New `LiveWorkoutOverlay` component.

---

## 3. 🔔 Smart Notifications (Behavioral)

### Concept
Notifications triggered by user behavior (or lack thereof) rather than just fixed times.

### Triggers
-   **Streak Risk**: "⚠️ You're about to lose your 5-day streak! Train before midnight." (Trigger: 8 PM if no activity).
-   **Leaderboard**: "👀 [User] just passed you on the ranking! Reclaim your spot." (Trigger: When rank changes).
-   **Milestone Approach**: "🔥 Just 1 more workout to reach Level 10!"
-   **Post-Workout**: "Great job! Don't forget to log your post-workout meal." (Trigger: 30 mins after workout finish).

### Technical Requirements
-   **Backend**: Edge Functions to analyze behavior and dispatch notifications (OneSignal or Expo Push).
-   **Logic**: "Smart Notification Engine" that checks rules periodically.

---

## 4. 🔓 RPG Levels & Unlockables

### Concept
A long-term progression system where the user "levels up" their profile.

### Mechanics
-   **XP System**: Cumulative points (lifetime) based on the same metrics as the Leaderboard.
-   **Levels**:
    -   Level 1-10: Beginner (Bronze border)
    -   Level 11-30: Intermediate (Silver border)
    -   Level 31-50: Advanced (Gold border)
    -   Level 50+: Elite (Platinum/Diamond)
-   **Unlockables**:
    -   **App Themes**: Unlock "Dark Red" theme at Level 10, "Cyberpunk" at Level 20.
    -   **Profile Avatars**: Exclusive frames/avatars.
    -   **Custom App Icons**: Change the launcher icon (Expo supports this).

### Technical Requirements
-   **Database**: Add `xp` and `level` columns to `profiles` or `gamification_profiles`.
-   **UI**: Level progress bar on Profile and Dashboard. Theme selector in Settings.

---

## Implementation Roadmap

1.  **Phase 1: Leaderboard (High Impact, Medium Effort)**
    -   Backend logic for points.
    -   Leaderboard UI.
2.  **Phase 2: Immersive Workout (High Impact, High Effort)**
    -   Refactor Workout Execution screen.
    -   Implement Audio/Haptics.
3.  **Phase 3: RPG System (Medium Impact, Low Effort)**
    -   Add XP tracking (reuse Leaderboard logic).
    -   Profile UI updates.
4.  **Phase 4: Smart Notifications (Medium Impact, Medium Effort)**
    -   Requires external notification service setup/refinement.
