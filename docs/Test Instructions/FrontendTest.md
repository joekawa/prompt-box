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

### 4. Manage Teams Page
**Goal**: Verify team management functionality (Create, Read, Update, Delete, Manage Members).

1.  **Login** as an Admin (e.g., `admin@acme.com`).
2.  Navigate to `/dashboard/teams` (or click "Manage Teams" in sidebar).
3.  **Verify List**:
    *   Teams are listed alphabetically.
    *   Columns: Team Name, Description, Created At, Actions.
    *   Pagination controls appear if more than 10 teams.
4.  **Create Team**:
    *   Click "Create Team".
    *   Enter Name and Description.
    *   Click "Create Team".
    *   Verify the new team appears in the list.
5.  **Edit Team**:
    *   Click the Edit icon (pencil) on a team.
    *   Change the name or description.
    *   Click "Save Changes".
    *   Verify the updates are reflected in the list.
6.  **Manage Members**:
    *   Click the Users icon on a team.
    *   **Add**: Enter an email of an existing organization member (e.g., `dev@acme.com`) and click "Add". Verify user appears in list.
    *   **Remove**: Click "Remove" next to a user. Verify user is removed.
7.  **Delete Team**:
    *   Click the Delete icon (trash can) on a team.
    *   Confirm the dialog.
    *   Verify the team is removed from the list.

## Directory Structure

Tests should be co-located with the components they test or placed in a `__tests__` directory.

```text
src/
  components/
    pages/
      WelcomePage.js
      WelcomePage.test.js  <-- Recommended location

## Test Users

The following users are available after running `python3 backend/manage.py populate_data`:

### Acme Corp
*   **Admin**: admin@acme.com / password123
*   **Developer**: dev@acme.com / password123
*   **Marketing**: marketing@acme.com / password123

### Globex Corporation
*   **Admin**: hank@globex.com / password123
*   **Member**: homer@globex.com / password123
```
