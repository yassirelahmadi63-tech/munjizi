# Authentication & Authorization Helpers for Munjizi
import secrets
from datetime import datetime, timezone, timedelta
from bottle import request, response, HTTPError
from server.database import get_db

SESSION_EXPIRY_DAYS = 30

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def create_session(user_id: int) -> str:
    conn = get_db()
    cursor = conn.cursor()
    token = secrets.token_hex(32)
    created_at = now_iso()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)).isoformat()
    cursor.execute('''
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?);
    ''', (token, user_id, created_at, expires_at))
    conn.commit()
    conn.close()
    return token

def delete_session(token: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?;", (token,))
    conn.commit()
    conn.close()

def get_auth_token() -> str:
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    # Check cookie fallback
    return request.get_cookie('munjizi_token', '')

def get_current_user():
    token = get_auth_token()
    if not token:
        return None

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT u.id, u.email, u.role, u.account_status, u.plan_id, u.plan_status, u.plan_start_date,
           p.name, p.school_level, p.avatar, p.preferred_language, p.theme,
           s.expires_at,
           pl.name_ar as plan_name_ar, pl.ai_limit_per_period, pl.max_subjects
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN plans pl ON pl.id = u.plan_id
    WHERE s.token = ?;
    ''', (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    # Check session expiration
    if row['expires_at'] and row['expires_at'] < now_iso():
        delete_session(token)
        return None

    return dict(row)

def require_auth():
    user = get_current_user()
    if not user:
        response.status = 401
        return {"error": "UNAUTHORIZED", "message": "يرجى تسجيل الدخول أولاً للمتابعة."}

    if user['account_status'] == 'suspended':
        response.status = 403
        return {
            "error": "ACCOUNT_SUSPENDED",
            "message": "تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي."
        }

    if user['account_status'] == 'deleted':
        response.status = 401
        return {"error": "ACCOUNT_DELETED", "message": "هذا الحساب تم حذفه."}

    return user

def require_admin():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return user

    if user.get('role') != 'admin':
        response.status = 403
        return {
            "error": "FORBIDDEN",
            "message": "عذراً! لا تملك صلاحيات المشرف للوصول إلى هذا القسم."
        }

    return user

def check_ai_usage_limit(user: dict) -> dict:
    user_id = user['id']
    ai_limit = user.get('ai_limit_per_period', 10)
    
    conn = get_db()
    cursor = conn.cursor()

    # Get current period (month)
    today = datetime.now(timezone.utc)
    period_start = today.replace(day=1, hour=0, minute=0, second=0).isoformat()
    period_end = (today.replace(day=28) + timedelta(days=4)).replace(day=1).isoformat()

    cursor.execute('''
    SELECT requests_used FROM ai_usage 
    WHERE user_id = ? AND period_start = ?;
    ''', (user_id, period_start))
    row = cursor.fetchone()

    used = row['requests_used'] if row else 0
    remaining = max(0, ai_limit - used)

    if used >= ai_limit:
        conn.close()
        return {
            "allowed": False,
            "requests_used": used,
            "requests_limit": ai_limit,
            "requests_remaining": 0,
            "message": f"لقد استهلكت رصيدك الشهري من المساعد الذكي ({ai_limit} طلبات). يرجى الترقية إلى باقة المتفوقين (PRO) للحصول على رصيد موسع!"
        }

    # Increment usage
    if row:
        cursor.execute('''
        UPDATE ai_usage SET requests_used = requests_used + 1
        WHERE user_id = ? AND period_start = ?;
        ''', (user_id, period_start))
    else:
        cursor.execute('''
        INSERT INTO ai_usage (user_id, period_start, period_end, requests_used)
        VALUES (?, ?, ?, 1);
        ''', (user_id, period_start, period_end))

    conn.commit()
    conn.close()

    return {
        "allowed": True,
        "requests_used": used + 1,
        "requests_limit": ai_limit,
        "requests_remaining": max(0, ai_limit - (used + 1))
    }

def get_user_ai_stats(user_id: int, ai_limit: int) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now(timezone.utc)
    period_start = today.replace(day=1, hour=0, minute=0, second=0).isoformat()
    cursor.execute('''
    SELECT requests_used FROM ai_usage 
    WHERE user_id = ? AND period_start = ?;
    ''', (user_id, period_start))
    row = cursor.fetchone()
    conn.close()

    used = row['requests_used'] if row else 0
    return {
        "requests_used": used,
        "requests_limit": ai_limit,
        "requests_remaining": max(0, ai_limit - used)
    }
