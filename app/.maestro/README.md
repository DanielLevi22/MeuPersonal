# E2E Testing with Maestro

This directory contains end-to-end tests for the MeuPersonal mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

### Install Maestro

**macOS/Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows:**
```powershell
# Install via Scoop
scoop bucket add maestro https://github.com/mobile-dev-inc/maestro
scoop install maestro
```

Verify installation:
```bash
maestro --version
```

## Test Flows

### 1. Student Login (`student-login.yaml`)
Tests basic authentication for student users.

**What it tests:**
- App launch
- Login form interaction
- Successful authentication
- Dashboard visibility
- Navigation tabs presence

**Run:**
```bash
pnpm test:e2e:login
```

### 2. Workout Execution (`workout-execution.yaml`)
Tests complete workout flow from start to finish.

**What it tests:**
- Login
- Navigation to workouts
- Workout selection
- Starting a workout
- Timer functionality
- Completing sets
- Finishing workout

**Run:**
```bash
pnpm test:e2e:workout
```

### 3. Nutrition Tracking (`nutrition-tracking.yaml`)
Tests diet plan viewing and meal tracking.

**What it tests:**
- Login
- Navigation to nutrition
- Viewing diet plan
- Marking meals as completed
- Viewing meal details

**Run:**
```bash
pnpm test:e2e:nutrition
```

### 4. Professional - Create Student (`professional-create-student.yaml`)
Tests professional creating a new student.

**What it tests:**
- Professional login
- Navigation to students
- Creating new student
- Form validation
- Student appears in list

**Run:**
```bash
maestro test .maestro/professional-create-student.yaml
```

## Running Tests

### Run All Tests
```bash
pnpm test:e2e
```

### Run Specific Test
```bash
maestro test .maestro/student-login.yaml
```

### Run on Specific Platform
```bash
# iOS
maestro test --platform ios .maestro/student-login.yaml

# Android
maestro test --platform android .maestro/student-login.yaml
```

### Run with Device Selection
```bash
# List available devices
maestro test --list-devices

# Run on specific device
maestro test --device "Pixel 7" .maestro/student-login.yaml
```

## Test Data Requirements

Before running tests, ensure you have test accounts set up:

### Student Account
- **Email:** `student@test.com`
- **Password:** `password123`
- **Requirements:** 
  - Active workout plan assigned
  - Active diet plan assigned

### Professional Account
- **Email:** `personal@test.com`
- **Password:** `password123`
- **Requirements:**
  - At least one student linked

## Troubleshooting

### App Not Found
Make sure the app is installed on the device/emulator:
```bash
# Android
pnpm android

# iOS
pnpm ios
```

### Test Fails on Element Not Found
- Check if the app UI has changed
- Verify test data exists (workouts, diet plans, etc.)
- Update selectors in YAML files if needed

### Slow Tests
- Use a faster emulator/device
- Reduce wait times in test flows
- Run tests on physical devices for better performance

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run E2E Tests
        run: pnpm test:e2e
```

## Writing New Tests

1. Create a new `.yaml` file in `.maestro/`
2. Follow the existing test structure
3. Use descriptive names and comments
4. Test one user flow per file
5. Add assertions to verify expected behavior

Example:
```yaml
appId: com.meupersonal.app
---
# Your Test Name
# Description of what this tests

- launchApp
- tapOn: "Button Text"
- assertVisible: "Expected Text"
```

## Best Practices

- ✅ Keep tests focused on one flow
- ✅ Use meaningful assertions
- ✅ Add comments explaining complex steps
- ✅ Clean up test data after runs (if applicable)
- ✅ Make tests independent (don't rely on previous test state)
- ❌ Don't hardcode delays (use `assertVisible` instead)
- ❌ Don't test implementation details
- ❌ Don't create overly long test flows

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/commands)
- [Writing Tests Guide](https://maestro.mobile.dev/getting-started/writing-your-first-flow)
