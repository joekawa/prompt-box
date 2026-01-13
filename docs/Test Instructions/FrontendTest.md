# Frontend Testing Instructions

This document outlines the procedures for testing the Prompt Box frontend application. The frontend is built with React and uses `jest` and `react-testing-library` for unit and integration testing.

## Prerequisites

Ensure you have the dependencies installed:

```bash
cd frontend
npm install
```

## Unit & Integration Tests

We use `npm test` (which runs `react-scripts test`) to execute the test suite. This runs tests in interactive watch mode by default.

### Running All Tests

To run all tests once (useful for CI/CD):

```bash
npm test -- --watchAll=false
```

### Running Tests in Watch Mode

To run tests and watch for changes (development mode):

```bash
npm test
```

### Running Specific Tests

To run tests for a specific file:

```bash
npm test -- <filename>
# Example:
npm test -- App.test.js
```

### Test Coverage

To generate a coverage report:

```bash
npm test -- --coverage --watchAll=false
```

## Manual Testing Flows

### 1. Welcome Page Navigation
**Goal**: Verify the landing page properly routes users based on their intent (New vs Existing).

1.  Start the app: `npm start`
2.  Navigate to `http://localhost:3000/`
3.  **Verify Elements**:
    *   Header shows "Prompt Box" logo.
    *   "Login" and "Get Started" buttons in header.
    *   Hero section with "Request Demo" and "Existing User" buttons.
    *   Features section displaying RBAC, Team Hierarchy, and Model Agnostic cards.
4.  **Test Routing**:
    *   Click "Login" (header or hero) -> Should navigate to `/login`
    *   Click "Get Started" or "Request Demo" -> Should navigate to `/sales`

### 2. Login Page
**Goal**: Verify the login page placeholder exists.

1.  Navigate to `/login`
2.  **Verify**:
    *   "Login" heading is visible.
    *   "Back to Home" button works and redirects to `/`.

### 3. Sales/Trial Page
**Goal**: Verify the sales page placeholder exists.

1.  Navigate to `/sales`
2.  **Verify**:
    *   "Contact Sales" heading is visible.
    *   "Back to Home" button works and redirects to `/`.

## Directory Structure

Tests should be co-located with the components they test or placed in a `__tests__` directory.

```text
src/
  components/
    pages/
      WelcomePage.js
      WelcomePage.test.js  <-- Recommended location
```
