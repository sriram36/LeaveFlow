#!/usr/bin/env python3
"""
Complete LeaveFlow API Test Suite - All 39 Endpoints
"""

import requests
import json
from datetime import date, datetime, timedelta

BASE_URL = "https://leave-flow-cre9.vercel.app"
results = []

def test(cat, method, endpoint, expected=200, headers=None, json_data=None, params=None, data=None):
    """Test endpoint and record result."""
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
        status = "[OK]" if passed else "[FAIL]"
        
        try:
            resp_text = json.dumps(r.json(), indent=2)[:150]
        except:
            resp_text = r.text[:150]
        
        results.append({
            "category": cat,
            "method": method,
            "endpoint": endpoint,
            "expected": expected,
            "actual": r.status_code,
            "passed": passed,
            "response": resp_text
        })
        
        print(f"{status:7} {method:6} {endpoint:50} {r.status_code}")
        
    except Exception as e:
        results.append({
            "category": cat,
            "method": method,
            "endpoint": endpoint,
            "expected": expected,
            "actual": 0,
            "passed": False,
            "response": str(e)[:150]
        })
        print(f"[ERROR] {method:6} {endpoint:50} ERROR: {e}")

print("="*90)
print("LEAVEFLOW API - TESTING ALL 39 ENDPOINTS")
print("="*90)

# Login to get token
print("\n[AUTH] Authenticating...")
r = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "admin@leaveflow.com",
    "password": "admin123"
}, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=10)

token = None
if r.status_code == 200:
    token = r.json().get("access_token")
    print(f"[OK] Logged in successfully")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print(f"[WARN] Login failed ({r.status_code}) - some tests will be skipped")
    headers = {}

print("\n" + "="*90)

# PUBLIC ENDPOINTS (3)
print("\n[PUBLIC] Testing 3 endpoints...")
print("-"*90)
test("Public", "GET", "/")
test("Public", "GET", "/health")
test("Public", "GET", "/docs")

# AUTH ENDPOINTS (3)
print("\n[AUTH] Testing 3 endpoints...")
print("-"*90)
test("Auth", "GET", "/auth/me", 401)
test("Auth", "POST", "/auth/register", 422)
if token:
    test("Auth", "GET", "/auth/me", 200, headers=headers)

# WEBHOOK ENDPOINTS (3)
print("\n[WEBHOOK] Testing 3 endpoints...")
print("-"*90)
test("Webhook", "GET", "/webhook/whatsapp", 422)
test("Webhook", "GET", "/webhook/whatsapp", 200, params={
    "hub.mode": "subscribe",
    "hub.verify_token": "9581697955",
    "hub.challenge": "test"
})
test("Webhook", "GET", "/webhook/whatsapp/inspect-token", 200)

if not token:
    print("\n[WARN] Skipping authenticated endpoints - no token")
    exit()

# LEAVE ENDPOINTS (13)
print("\n[LEAVE] Testing 13 endpoints...")
print("-"*90)
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

# USER ENDPOINTS (9)
print("\n[USER] Testing 9 endpoints...")
print("-"*90)
test("User", "GET", "/users/", 200, headers=headers)
test("User", "GET", "/users/team", 200, headers=headers)
test("User", "GET", "/users/managers", 200, headers=headers)
test("User", "GET", "/users/1", 200, headers=headers)
test("User", "POST", "/users/", 422, headers=headers)
test("User", "GET", "/users/pending-accounts", 200, headers=headers)
test("User", "POST", "/users/999/approve", 404, headers=headers)
test("User", "POST", "/users/999/reject", 404, headers=headers)
test("User", "PUT", "/users/1/admin", 422, headers=headers)

# HOLIDAY ENDPOINTS (3)
print("\n[HOLIDAY] Testing 3 endpoints...")
print("-"*90)
test("Holiday", "GET", "/holidays/", 200, headers=headers)
test("Holiday", "POST", "/holidays/", 422, headers=headers)
test("Holiday", "DELETE", "/holidays/999", 404, headers=headers)

# ACCOUNT REQUEST ENDPOINTS (5)
print("\n[ACCOUNT] Testing 5 endpoints...")
print("-"*90)
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

print(f"Total: {total} | Passed: {passed} | Failed: {failed} | Rate: {(passed/total*100):.1f}%")

if failed > 0:
    print("\nFAILED TESTS:")
    for r in results:
        if not r["passed"]:
            print(f"   {r['method']} {r['endpoint']} - Expected {r['expected']}, Got {r['actual']}")

print("\nTest complete!")
