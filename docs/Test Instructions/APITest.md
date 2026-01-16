# API Testing Instructions

## Prerequisites
Ensure the backend server is running:
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

## 1. Test Data Setup
We have a management command to populate the database with sample data (Organization, Teams, Users, Prompts).

**Run this command to reset and populate data:**
```bash
python manage.py populate_data
```

> **Note:** This command deletes all existing users and sessions. You **must** re-login (Section 3) after running this command to generate a valid `cookies.txt`.

### Test Credentials
| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@acme.com` | `password123` | Organization Admin, Owner of all teams |
| **Developer** | `dev@acme.com` | `password123` | Member of "Engineering" |
| **Marketer** | `marketing@acme.com` | `password123` | Member of "Marketing" |

## 2. Automated Testing Script
We have provided a Python script that runs a sequence of API tests (Login -> List Orgs -> List Prompts -> List Teams).

**Run the script:**
```bash
python test_api_script.py
```

## 3. Manual Testing (cURL Examples)
You can also test individual endpoints using `curl`. Note that we use a cookie jar (`cookies.txt`) to maintain the session after login.

### Authentication (Login)
```bash
curl -c cookies.txt -b cookies.txt -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "password123"}'
```

### List Organizations
```bash
curl -b cookies.txt http://localhost:8000/api/organizations/
```

### List Prompts
```bash
curl -b cookies.txt http://localhost:8000/api/prompts/
```

### Create a Prompt
```bash
# Replace YOUR_ORG_UUID with an ID from the organizations list
curl -b cookies.txt -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Prompt",
    "prompt": "This is a test prompt content",
    "model": "gpt-4",
    "organization": "13dc9aa5-634a-4fd7-8cfa-32c4d2e12e74"
  }'
```

## 4. Key Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login/` | Log in |
| GET | `/api/organizations/` | List user's organizations |
| GET | `/api/teams/` | List teams |
| GET | `/api/prompts/` | List accessible prompts |
| POST | `/api/prompts/` | Create a new prompt |
| GET | `/api/users/me/` | Get current user info |

## 5. Advanced Create Prompt Scenarios

### Create a Private Prompt
Explicitly setting visibility to `PRIVATE`.
```bash
curl -b cookies.txt -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Private Prompt",
    "prompt": "This is for my eyes only",
    "model": "gpt-4",
    "visibility": "PRIVATE",
    "organization": "9292e78a-8058-4ef5-8376-356126be04fe"
  }'
```

### Create a Team Shared Prompt
Sharing a prompt with specific teams.
```bash
curl -b cookies.txt -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Shared Prompt",
    "prompt": "Helpful for the whole team",
    "model": "gpt-4",
    "visibility": "TEAM",
    "team_ids": ["73e6ea9c-39d6-425b-bf0e-d53644de9da3"],
    "organization": "9292e78a-8058-4ef5-8376-356126be04fe"
  }'
```

### Create a Categorized Prompt
Adding categories to a prompt.
```bash
curl -b cookies.txt -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Prompt",
    "prompt": "Write a blog post about...",
    "model": "gpt-3.5-turbo",
    "visibility": "TEAM",
    "category_ids": ["51a86ebc-95e0-4cfb-8275-44cd8e9e30c1"],
    "team_ids": ["d807383e-c1fd-4bd4-8e01-14e6b870a925"],
    "organization": "13dc9aa5-634a-4fd7-8cfa-32c4d2e12e74"
  }'
```

## 6. Automated Unit Tests
We have added specific unit tests for the Prompt Creation workflow, covering visibility settings, team sharing, and categorization.

**Run the prompt tests:**
```bash
python manage.py test promptbox.tests.test_prompts
```
