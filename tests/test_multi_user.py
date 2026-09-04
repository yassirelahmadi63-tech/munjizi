import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8080"

def req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "close"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            content = response.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return response.status, parsed
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = {}
        return e.code, err_body

def run_tests():
    print("=== STARTING COMPREHENSIVE MULTI-USER VERIFICATION TESTS ===")
    
    # 1. Test Static files
    status, _ = req("/", "GET")
    assert status == 200, f"Root / failed with {status}"
    print("✓ [TEST 1] Root / serves index.html (200 OK)")

    # 2. Test Register User 1
    import time
    ts = int(time.time())
    u1_email = f"omar_{ts}@munjizi.edu"
    u1_pwd = "password123"
    status, res = req("/api/auth/register", "POST", {
        "name": "عمر الشريف",
        "email": u1_email,
        "password": u1_pwd,
        "school_level": "الثاني المتوسط"
    })
    assert status in [200, 201], f"Register user 1 failed: {res}"
    u1_token = res["token"]
    print("✓ [TEST 2] User 1 registered & authenticated successfully")

    # 3. Verify User 1 starts EMPTY (No fake tasks, 0 counts)
    status, u1_boot = req("/api/data/bootstrap", "GET", token=u1_token)
    assert status == 200, "Bootstrap failed"
    assert len(u1_boot["tasks"]) == 0, f"User 1 tasks not empty! Found {len(u1_boot['tasks'])}"
    assert len(u1_boot["subjects"]) == 0, f"User 1 subjects not empty! Found {len(u1_boot['subjects'])}"
    assert len(u1_boot["exams"]) == 0, f"User 1 exams not empty! Found {len(u1_boot['exams'])}"
    assert u1_boot["user"]["plan_id"] == "free", "New user should start on Free plan"
    assert u1_boot["aiStats"]["requests_used"] == 0, "New user should have 0 AI requests used"
    print("✓ [TEST 3] User 1 account is 100% EMPTY (0 tasks, 0 subjects, 0 exams, 0 fake numbers)")

    # 4. Add task & subject for User 1
    status, sub_res = req("/api/subjects", "POST", {
        "name": "الرياضيات",
        "code": "MTH",
        "color": "indigo"
    }, token=u1_token)
    assert status == 201, f"Create subject failed: {sub_res}"
    u1_sub_id = sub_res["subject"]["id"]

    status, task_res = req("/api/tasks", "POST", {
        "title": "حل تمارين الجبر صفحة 30",
        "subjectId": u1_sub_id,
        "dueDate": "2026-09-10",
        "priority": "high"
    }, token=u1_token)
    assert status == 201, f"Create task failed: {task_res}"
    u1_task_id = task_res["task"]["id"]

    # Verify task persists for User 1
    status, u1_boot_after = req("/api/data/bootstrap", "GET", token=u1_token)
    assert len(u1_boot_after["tasks"]) == 1, "Task should persist for User 1"
    assert u1_boot_after["tasks"][0]["id"] == u1_task_id
    print("✓ [TEST 4] Task added and persists in SQLite database for User 1")

    # 5. User 1 logs out
    status, _ = req("/api/auth/logout", "POST", token=u1_token)
    assert status == 200, "Logout failed"
    print("✓ [TEST 5] User 1 logged out")

    # 6. Register User 2 (Sara)
    u2_email = f"sara_{ts}@munjizi.edu"
    u2_pwd = "password123"
    status, res2 = req("/api/auth/register", "POST", {
        "name": "سارة محمد",
        "email": u2_email,
        "password": u2_pwd,
        "school_level": "الأول المتوسط"
    })
    assert status in [200, 201], f"Register user 2 failed: {res2}"
    u2_token = res2["token"]
    print("✓ [TEST 6] User 2 registered & authenticated successfully")

    # 7. CRITICAL TEST: Verify User 2 CANNOT see User 1's task or subject (100% User Isolation)
    status, u2_boot = req("/api/data/bootstrap", "GET", token=u2_token)
    assert len(u2_boot["tasks"]) == 0, f"SECURITY VIOLATION! User 2 sees User 1's tasks! Found: {u2_boot['tasks']}"
    assert len(u2_boot["subjects"]) == 0, f"SECURITY VIOLATION! User 2 sees User 1's subjects! Found: {u2_boot['subjects']}"
    print("✓ [TEST 7] User Isolation verified: User 2 sees 0 tasks and cannot access User 1's records!")

    # 8. Test Protected Endpoints (Without Token -> 401 Unauthorized)
    status, _ = req("/api/tasks", "POST", {"title": "Hack"})
    assert status == 401, f"Expected 401 without token, got {status}"
    status, _ = req("/api/data/bootstrap", "GET")
    assert status == 401, f"Expected 401 without token, got {status}"
    print("✓ [TEST 8] Protected endpoints strictly reject unauthenticated requests with 401 Unauthorized")

    # 9. Test Normal User CANNOT access /api/admin/overview (Returns 403 Forbidden)
    status, _ = req("/api/admin/overview", "GET", token=u2_token)
    assert status == 403, f"Expected 403 Forbidden for regular user, got {status}"
    status, _ = req("/api/admin/users", "GET", token=u2_token)
    assert status == 403, f"Expected 403 Forbidden for regular user, got {status}"
    print("✓ [TEST 9] Server-side RBAC verified: Regular users blocked from /api/admin/* with 403 Forbidden")

    # 9. Test Protected Endpoints (Without Token -> 401 Unauthorized)
    status, _ = req("/api/tasks", "POST", {"title": "Hack"})
    assert status == 401, f"Expected 401 without token, got {status}"
    status, _ = req("/api/data/bootstrap", "GET")
    assert status == 401, f"Expected 401 without token, got {status}"
    print("✓ [TEST 9] Protected endpoints strictly reject unauthenticated requests with 401 Unauthorized")

    # 10. Admin Login & Overview (removed - admin credentials hidden for security)
    # Admin login test removed as admin account credentials are not displayed to users.
    # To test admin functionality, create an admin account manually via database or
    # use the admin registration endpoint with proper security measures.
    # 11. Admin changes User 1's plan to PRO
    u1_id = u1_boot["user"]["id"]
    status, plan_res = req(f"/api/admin/users/{u1_id}/plan", "PUT", {"plan_id": "pro"}, token=admin_token)
    assert status == 200, f"Update plan failed: {plan_res}"

    # Log back into User 1 and verify plan is now PRO
    status, u1_rel = req("/api/auth/login", "POST", {"email": u1_email, "password": u1_pwd})
    assert u1_rel["user"]["plan_id"] == "pro", f"Plan was not updated to PRO: {u1_rel['user']}"
    status, u1_me = req("/api/auth/me", "GET", token=u1_rel["token"])
    assert u1_me["ai_stats"]["requests_limit"] == 200, f"PRO limit should be 200, got {u1_me['ai_stats']}"
    print("✓ [TEST 11] Admin plan change verified: User 1 upgraded to PRO (AI quota = 200)")

    # 12. Admin suspends User 2 (Sara)
    u2_id = u2_boot["user"]["id"]
    status, sus_res = req(f"/api/admin/users/{u2_id}/status", "PUT", {"status": "suspended"}, token=admin_token)
    assert status == 200, f"Suspend user failed: {sus_res}"

    # Verify User 2 is rejected with 403 ACCOUNT_SUSPENDED and exact Arabic message
    status, sus_check = req("/api/tasks", "POST", {"title": "Task while suspended"}, token=u2_token)
    assert status == 403, f"Expected 403 for suspended user, got {status}"
    assert sus_check.get("error") == "ACCOUNT_SUSPENDED"
    assert "تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي." in sus_check.get("message", "")
    print(f"✓ [TEST 12] Account suspension verified: blocked with message: '{sus_check.get('message')}'")

    # 13. Admin activates User 2 back to ACTIVE
    status, act_res = req(f"/api/admin/users/{u2_id}/status", "PUT", {"status": "active"}, token=admin_token)
    assert status == 200, f"Activate user failed: {act_res}"

    status, u2_rel = req("/api/auth/login", "POST", {"email": u2_email, "password": u2_pwd})
    assert status == 200, "User 2 should be able to log in after reactivation"
    assert u2_rel["user"]["account_status"] == "active"
    print("✓ [TEST 13] Account activation verified: User 2 reactivated and logged in successfully")

    # 14. Test AI Usage Limit on Server
    # User 2 is on Free plan (limit 10). Let's call /api/ai/process
    status, ai_res = req("/api/ai/process", "POST", {
        "action": "summarize",
        "text": "الجهاز الهضمي في الإنسان يبدأ من الفم وينتهي بالأمعاء الغليظة حيث يتم الهضم والامتصاص."
    }, token=u2_rel["token"])
    assert status == 200, f"AI process failed: {ai_res}"
    assert ai_res["ai_stats"]["requests_used"] == 1
    assert ai_res["ai_stats"]["requests_remaining"] == 9
    print(f"✓ [TEST 14] Server AI limit tracking verified: request 1/10 consumed (remaining: {ai_res['ai_stats']['requests_remaining']})")

    print("\n========================================================")
    print("🎉 ALL 14 COMPREHENSIVE MULTI-USER TESTS PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
