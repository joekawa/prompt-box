import requests
import json
import sys

BASE_URL = 'http://localhost:8000/api'
EMAIL = 'admin@acme.com'
PASSWORD = 'password123'

def print_response_error(response):
    print(f"❌ Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text[:500] + "..." if len(response.text) > 500 else response.text)

def run_tests():
    session = requests.Session()

    # 1. Login
    print(f"1. Logging in as {EMAIL}...")
    login_url = f"{BASE_URL}/auth/login/"
    try:
        response = session.post(login_url, json={'email': EMAIL, 'password': PASSWORD})

        if response.status_code == 200:
            print("✅ Login Successful")
            print(json.dumps(response.json(), indent=2))
        else:
            print("❌ Login Failed")
            print_response_error(response)
            return
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # 2. List Organizations
    print("\n2. Fetching Organizations...")
    org_url = f"{BASE_URL}/organizations/"
    response = session.get(org_url)
    if response.status_code == 200:
        print("✅ Organizations:")
        print(json.dumps(response.json(), indent=2))
    else:
        print("❌ Failed to fetch organizations")
        print_response_error(response)

    # 3. List Prompts
    print("\n3. Fetching Prompts...")
    prompts_url = f"{BASE_URL}/prompts/"
    response = session.get(prompts_url)
    if response.status_code == 200:
        print("✅ Prompts:")
        data = response.json()
        for p in data:
            print(f" - [{p['name']}] (Model: {p['model']})")
    else:
        print("❌ Failed to fetch prompts")
        print_response_error(response)

    # 4. List Teams
    print("\n4. Fetching Teams...")
    teams_url = f"{BASE_URL}/teams/"
    response = session.get(teams_url)
    if response.status_code == 200:
        print("✅ Teams:")
        data = response.json()
        for t in data:
            print(f" - [{t['name']}]")
    else:
        print("❌ Failed to fetch teams")
        print_response_error(response)

    # 5. List Categories
    print("\n5. Fetching Categories...")
    categories_url = f"{BASE_URL}/categories/"
    response = session.get(categories_url)
    if response.status_code == 200:
        print("✅ Categories:")
        data = response.json()
        for c in data:
            print(f" - [{c['name']}] ({c['description']})")
    else:
        print("❌ Failed to fetch categories")
        print_response_error(response)

if __name__ == "__main__":
    run_tests()
