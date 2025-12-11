import requests
import json
import sys

# Force UTF-8 output
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://leave-flow-cre9.vercel.app"
results = []

def test(cat, method, endpoint, expected=200, headers=None, params=None, json_data=None, data=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            if data:
                r = requests.post(url, headers=headers, data=data, timeout=10)
            else:
                r = requests.post(url, headers=headers, json=json_data, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, json=json_data, timeout=10)
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=json_data, timeout=10)
        else:
            return
        
        passed = r.status_code == expected
        status = "PASS" if passed else "FAIL"
        
        results.append({
            "category": cat,
            "method": method,
            "endpoint": endpoint,
            "expected": expected,
            "actual": r.status_code,
            "passed": passed
        })
        
        print(f"{status:5} | {method:6} | {endpoint:45} | {r.status_code}")
        
    except Exception as e:
        results.append({
            "category": cat,
            "method": method,
            "endpoint": endpoint,
            "expected": expected,
            "actual": 0,
            "passed": False
        })
        print(f"ERROR | {method:6} | {endpoint:45} | {str(e)[:30]}")

print("="*90)
print("LEAVEFLOW API - TESTING ALL 39 ENDPOINTS")
print("="*90)

# Login
print("\nAuthenticating...")
r = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "admin@leaveflow.com",
    "password": "admin123"
})

token = None
if r.status_code == 200:
    token = r.json().get("access_token")
    print(f"Login successful\n")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print(f"Login failed ({r.status_code}) - skipping authenticated tests\n")
    headers = {}

print("="*90)
print("Status | Method | Endpoint                                    | Code")
print("="*90)

# PUBLIC (3)
print("\n[PUBLIC - 3 endpoints]")
test("Public", "GET", "/")
test("Public", "GET", "/health")
test("Public", "GET", "/docs")

# AUTH (3)
print("\n[AUTH - 3 endpoints]")
test("Auth", "GET", "/auth/me", 401)
test("Auth", "POST", "/auth/register", 422)
if token:
    test("Auth", "GET", "/auth/me", 200, headers=headers)

# WEBHOOK (3)
print("\n[WEBHOOK - 3 endpoints]")
test("Webhook", "GET", "/webhook/whatsapp", 422)
test("Webhook", "GET", "/webhook/whatsapp", 200, params={
    "hub.mode": "subscribe",
    "hub.verify_token": "9581697955",
    "hub.challenge": "test"
})
test("Webhook", "GET", "/webhook/whatsapp/inspect-token", 200)

if not token:
    print("\nNo token - skipping authenticated endpoints")
    sys.exit(0)

# LEAVE (13)
print("\n[LEAVE - 13 endpoints]")
test("Leave", "GET", "/leave/balance", 200, headers=headers)
test("Leave", "GET", "/leave/balance/1", 200, headers=headers)
test("Leave", "GET", "/leave/today", 200, headers=headers)
test("Leave", "GET", "/leave/history", 200, headers=headers)
test("Leave", "GET", "/leave/pending", 200, headers=headers)
test("Leave", "GET", "/leave/1", 200, headers=headers)
test("Leave", "POST", "/leave/approve/999", 400, headers=headers)
test("Leave", "POST", "/leave/reject/999", 400, headers=headers, json_data={"reason": "test"})
test("Leave", "POST", "/leave/cancel/999", 400, headers=headers)
test("Leave", "GET", "/leave/1/attachment", 200, headers=headers)
test("Leave", "GET", "/leave/balance/history", 200, headers=headers)
test("Leave", "POST", "/leave/carry-forward", 200, headers=headers)
test("Leave", "GET", "/leave/requests/search", 200, headers=headers)

# USER (9)
print("\n[USER - 9 endpoints]")
test("User", "GET", "/users/", 200, headers=headers)
test("User", "GET", "/users/team", 200, headers=headers)
test("User", "GET", "/users/managers", 200, headers=headers)
test("User", "GET", "/users/1", 200, headers=headers)
test("User", "POST", "/users/", 422, headers=headers)
test("User", "GET", "/users/pending-accounts", 200, headers=headers)
test("User", "POST", "/users/999/approve", 404, headers=headers)
test("User", "POST", "/users/999/reject", 404, headers=headers)
test("User", "PUT", "/users/1/admin", 422, headers=headers)

# HOLIDAY (3)
print("\n[HOLIDAY - 3 endpoints]")
test("Holiday", "GET", "/holidays/", 200, headers=headers)
test("Holiday", "POST", "/holidays/", 422, headers=headers)
test("Holiday", "DELETE", "/holidays/999", 404, headers=headers)

# ACCOUNT REQUEST (5)
print("\n[ACCOUNT REQUEST - 5 endpoints]")
test("AccReq", "GET", "/account-requests/", 200, headers=headers)
test("AccReq", "GET", "/account-requests/pending-count", 200, headers=headers)
test("AccReq", "GET", "/account-requests/999", 404, headers=headers)
test("AccReq", "POST", "/account-requests/", 422, headers=headers)
test("AccReq", "POST", "/account-requests/999/approve", 404, headers=headers, json_data={"approved": True})

# Summary
print("\n" + "="*90)
print("SUMMARY")
print("="*90)
total = len(results)
passed = sum(1 for r in results if r["passed"])
failed = total - passed

print(f"\nTotal:  {total}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print(f"Rate:   {(passed/total*100):.1f}%")

if failed > 0:
    print("\n" + "="*90)
    print("FAILED TESTS")
    print("="*90)
    for r in results:
        if not r["passed"]:
            print(f"{r['method']:6} {r['endpoint']:45} Expected: {r['expected']}, Got: {r['actual']}")

print("\nTest complete!")
