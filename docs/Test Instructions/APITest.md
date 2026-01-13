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
    "organization": "YOUR_ORG_UUID"
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
