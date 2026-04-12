# Architecture & Quality Master Plan

## 1. Executive Summary
This document consolidates the architectural vision for **Meupersonal**, focusing on a robust **Single Repository** structure to eliminate build complexity while maintaining high code quality.

**Core Vision:** A scalable, modular Mobile application (Student/Personal) with clear boundaries, type safety, and a standardized codebase, prepared for future extensions (Web Dashboard) without the immediate overhead of a complex Monorepo.

---

## 2. Technology Stack (Confirmed)
-   **Mobile:** React Native + Expo + NativeWind
-   **Architecture:** Modular Monolith (Single Repo)
-   **Navigation:** Expo Router (File-based)
-   **State:** Zustand (Global) + TanStack Query (Server)
-   **Backend:** Supabase (Auth, DB, Realtime, Storage, Edge Functions)
-   **ACL:** CASL (Client-side permissions) + RLS (DB Security)
-   **Testing:** Jest & jest-expo (Unit) + Maestro (E2E)

---

## 3. Immediate Action Plan (Quality & Refactor)
The priority is stability and quality of the current codebase.

### Phase A: Architecture Cleanup
1.  **Strict Modular Boundaries**: 
    -   Enforce `src/modules/{feature}/index.ts` as the ONLY public entry point.
    -   Refactor cross-module imports to use these public APIs.
2.  **Navigation Hardening**:
    -   Replace loose strings `router.push('/(tabs)/...')` with typed routes.
    -   Centralize strict route definitions to prevent "Stack Duplication" bugs.
3.  **Type Safety**:
    -   Eliminate `any` types in Stores and API responses.
    -   Sync Supabase types with the DB schema.

### Phase B: Testing & Confidence
1.  **Unit Tests (Jest)**: 80%+ coverage goal for core logic (Zustand stores, business logic).re`, `workoutStore`) and Utilities.
2.  **E2E Tests (Maestro)**:
    -   Automate "Critical Paths": Login -> Create Periodization -> Student View.

---

## 4. Strategic Evolution
*Reference: `architecture_strategy.md`*

To support growth, we will maintain good separation within `src/` to make future extraction easier if needed:

### 4.1. Conceptual Separation
-   `src/modules/*`: Feature-specific logic (Workout, Student, Auth).
-   `src/components/ui`: Shared Design System components.
-   `src/services`: External API clients (Supabase).

This "Modular Monolith" approach allows us to move fast now and extract packages later only when specifically needed for a Web Dashboard.

---

## 5. Development Standards
*Reference: `best_practices.md`*

-   **Styling**: Valid Tailwind classes only. No inline styles.
-   **Components**: Composite pattern (Root, Icon, Label) for complex UI.
-   **Data Fetching**: All mutations must invalidate relevant Queries.
-   **Git**: Conventional Commits + Husky hooks for pre-commit linting.

---

## 6. Next Steps for Developer
1.  **Navigation Refactor**: Audit and fix `router` usage.
2.  **Lint/Format Enforce**: Ensure Prettier/ESLint are active.
3.  **Module Audit**: Clean up `src/modules` exports.
