# Munjizi Full-Stack Server
# Multi-User Backend with SQLite, Real Auth, Plans, AI Limits & Admin Dashboard
import os
import json
import sqlite3
import secrets
from datetime import datetime, timezone
import bottle
from bottle import Bottle, request, response, static_file, HTTPError

from server.database import get_db, init_database, hash_password, verify_password
from server.auth import (
    create_session, delete_session, get_auth_token, get_current_user,
    require_auth, require_admin, check_ai_usage_limit, get_user_ai_stats, now_iso
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Bottle()

# Initialize DB on startup
init_database()

# --- CORS & JSON Helper ---
@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-Requested-With'

@app.route('/api/<:path>', method=['OPTIONS'])
def api_options(path):
    response.status = 200
    return {}

def json_response(data, status=200):
    response.content_type = 'application/json; charset=utf-8'
    response.status = status
    return json.dumps(data, ensure_ascii=False)

def get_json_body():
    try:
        return request.json or {}
    except Exception:
        try:
            return json.loads(request.body.read().decode('utf-8'))
        except Exception:
            return {}

# ==============================================================================
# 1. AUTHENTICATION ENDPOINTS
# ==============================================================================

@app.route('/api/auth/register', method='POST')
def auth_register():
    data = get_json_body()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    school_level = (data.get('school_level') or 'الثاني المتوسط').strip()

    if not name or not email or not password:
        return json_response({"error": "VALIDATION_ERROR", "message": "يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، وكلمة المرور)."}, 400)

    if len(password) < 6:
        return json_response({"error": "VALIDATION_ERROR", "message": "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."}, 400)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?;", (email,))
    if cursor.fetchone():
        conn.close()
        return json_response({"error": "EMAIL_EXISTS", "message": "هذا البريد الإلكتروني مسجل مسبقاً! يرجى تسجيل الدخول."}, 409)

    pwd_hash, salt = hash_password(password)
    now = now_iso()

    cursor.execute('''
    INSERT INTO users (email, password_hash, salt, role, account_status, plan_id, plan_status, plan_start_date, created_at, updated_at)
    VALUES (?, ?, ?, 'user', 'active', 'free', 'active', ?, ?, ?);
    ''', (email, pwd_hash, salt, now, now, now))
    user_id = cursor.lastrowid

    cursor.execute('''
    INSERT INTO profiles (user_id, name, school_level, avatar, preferred_language, theme, updated_at)
    VALUES (?, ?, ?, '🎓', 'ar', 'light', ?);
    ''', (user_id, name, school_level, now))

    conn.commit()
    conn.close()

    token = create_session(user_id)
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "school_level": school_level,
        "role": "user",
        "account_status": "active",
        "plan_id": "free",
        "plan_name_ar": "الباقة المجانية",
        "avatar": "🎓",
        "theme": "light"
    }

    return json_response({
        "success": True,
        "message": "تم إنشاء حسابك بنجاح! مرحباً بك في مُنجزي.",
        "token": token,
        "user": user,
        "is_new_user": True
    }, 201)

@app.route('/api/auth/login', method='POST')
def auth_login():
    data = get_json_body()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return json_response({"error": "VALIDATION_ERROR", "message": "يرجى إدخال البريد الإلكتروني وكلمة المرور."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT u.id, u.email, u.password_hash, u.salt, u.role, u.account_status, u.plan_id,
           p.name, p.school_level, p.avatar, p.theme,
           pl.name_ar as plan_name_ar, pl.ai_limit_per_period
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN plans pl ON pl.id = u.plan_id
    WHERE u.email = ?;
    ''', (email,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(password, row['password_hash'], row['salt']):
        return json_response({"error": "INVALID_CREDENTIALS", "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة."}, 401)

    if row['account_status'] == 'suspended':
        return json_response({
            "error": "ACCOUNT_SUSPENDED",
            "message": "تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي."
        }, 403)

    if row['account_status'] == 'deleted':
        return json_response({"error": "ACCOUNT_DELETED", "message": "هذا الحساب تم حذفه."}, 401)

    token = create_session(row['id'])
    user = {
        "id": row['id'],
        "email": row['email'],
        "name": row['name'] or 'طالب مُنجز',
        "school_level": row['school_level'] or 'المرحلة المتوسطة',
        "role": row['role'],
        "account_status": row['account_status'],
        "plan_id": row['plan_id'],
        "plan_name_ar": row['plan_name_ar'] or 'الباقة المجانية',
        "avatar": row['avatar'] or '🎓',
        "theme": row['theme'] or 'light'
    }

    return json_response({
        "success": True,
        "token": token,
        "user": user
    })

@app.route('/api/auth/logout', method='POST')
def auth_logout():
    token = get_auth_token()
    if token:
        delete_session(token)
    return json_response({"success": True, "message": "تم تسجيل الخروج بنجاح."})

@app.route('/api/auth/me', method='GET')
def auth_me():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    ai_stats = get_user_ai_stats(user['id'], user.get('ai_limit_per_period', 10))
    return json_response({
        "user": user,
        "ai_stats": ai_stats
    })

@app.route('/api/auth/profile', method='PUT')
def update_profile():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    name = (data.get('name') or user['name']).strip()
    school_level = (data.get('school_level') or user['school_level']).strip()
    avatar = (data.get('avatar') or user['avatar']).strip()
    theme = (data.get('theme') or user['theme']).strip()
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE profiles
    SET name = ?, school_level = ?, avatar = ?, theme = ?, updated_at = ?
    WHERE user_id = ?;
    ''', (name, school_level, avatar, theme, now, user['id']))
    conn.commit()
    conn.close()

    user.update({
        "name": name,
        "school_level": school_level,
        "avatar": avatar,
        "theme": theme
    })

    return json_response({"success": True, "user": user, "message": "تم تحديث الملف الشخصي بنجاح."})

@app.route('/api/auth/change-password', method='POST')
def change_password():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    old_password = (data.get('old_password') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if len(new_password) < 6:
        return json_response({"error": "VALIDATION_ERROR", "message": "يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash, salt FROM users WHERE id = ?;", (user['id'],))
    row = cursor.fetchone()

    if not row or not verify_password(old_password, row['password_hash'], row['salt']):
        conn.close()
        return json_response({"error": "INVALID_PASSWORD", "message": "كلمة المرور الحالية غير صحيحة."}, 400)

    pwd_hash, salt = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?;",
                   (pwd_hash, salt, now_iso(), user['id']))
    conn.commit()
    conn.close()

    return json_response({"success": True, "message": "تم تغيير كلمة المرور بنجاح."})

@app.route('/api/auth/forgot-password', method='POST')
def forgot_password():
    data = get_json_body()
    email = (data.get('email') or '').strip().lower()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?;", (email,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        # For security, return generic success message so attacker can't enumerate emails
        return json_response({"success": True, "message": "إذا كان البريد مسجلاً، تم إرسال تعليمات إعادة التعيين."})

    import secrets
    from datetime import timedelta
    reset_token = secrets.token_hex(20)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()

    cursor.execute('''
    INSERT INTO password_resets (token, user_id, expires_at, used)
    VALUES (?, ?, ?, 0);
    ''', (reset_token, user['id'], expires_at))
    conn.commit()
    conn.close()

    return json_response({
        "success": True,
        "message": "تم إنشاء رابط استعادة كلمة المرور بنجاح.",
        "reset_token": reset_token  # Provided directly for immediate student password reset in MVP
    })

@app.route('/api/auth/reset-password', method='POST')
def reset_password():
    data = get_json_body()
    token = (data.get('token') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if len(new_password) < 6:
        return json_response({"error": "VALIDATION_ERROR", "message": "كلمة المرور يجب أن لا تقل عن 6 أحرف."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, expires_at, used FROM password_resets WHERE token = ?;", (token,))
    row = cursor.fetchone()

    if not row or row['used'] == 1 or row['expires_at'] < now_iso():
        conn.close()
        return json_response({"error": "INVALID_TOKEN", "message": "رمز استعادة كلمة المرور غير صالح أو منتهي الصلاحية."}, 400)

    pwd_hash, salt = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?;",
                   (pwd_hash, salt, now_iso(), row['user_id']))
    cursor.execute("UPDATE password_resets SET used = 1 WHERE token = ?;", (token,))
    conn.commit()
    conn.close()

    return json_response({"success": True, "message": "تمت إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول."})

# ==============================================================================
# 2. USER DATA BOOTSTRAP (100% ISOLATED BY USER_ID)
# ==============================================================================

@app.route('/api/data/bootstrap', method='GET')
def data_bootstrap():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    user_id = user['id']
    conn = get_db()
    cursor = conn.cursor()

    # Tasks (ONLY user's tasks)
    cursor.execute('''
    SELECT id, user_id, title, subject_id, description, due_date, due_time,
           priority, completed, completed_at, notes, created_at, updated_at
    FROM tasks WHERE user_id = ? ORDER BY due_date ASC;
    ''', (user_id,))
    tasks = [dict(r) for r in cursor.fetchall()]
    for t in tasks:
        t['completed'] = bool(t['completed'])
        t['subjectId'] = t['subject_id']
        t['dueDate'] = t['due_date']
        t['dueTime'] = t['due_time']

    # Subjects (ONLY user's subjects)
    cursor.execute('''
    SELECT id, user_id, name, code, color, icon, teacher, description, created_at
    FROM subjects WHERE user_id = ? ORDER BY created_at ASC;
    ''', (user_id,))
    raw_subjects = [dict(r) for r in cursor.fetchall()]
    subjects = []
    for s in raw_subjects:
        c = s['color'] or 'indigo'
        s['bgLight'] = f"bg-{c}-50 text-{c}-700 border-{c}-200 dark:bg-{c}-950/40 dark:text-{c}-300 dark:border-{c}-800"
        s['badgeColor'] = f"bg-{c}-500"
        subjects.append(s)

    # Exams (ONLY user's exams)
    cursor.execute('''
    SELECT id, user_id, name, subject_id, date, time, room, notes, created_at
    FROM exams WHERE user_id = ? ORDER BY date ASC;
    ''', (user_id,))
    exams = [dict(r) for r in cursor.fetchall()]
    for e in exams:
        e['subjectId'] = e['subject_id']

    # Timetable (ONLY user's slots)
    cursor.execute('''
    SELECT id, user_id, day, period, subject_id, room, created_at
    FROM timetable WHERE user_id = ?;
    ''', (user_id,))
    timetable = [dict(r) for r in cursor.fetchall()]
    for slot in timetable:
        slot['subjectId'] = slot['subject_id']

    # Notes (ONLY user's notes)
    cursor.execute('''
    SELECT id, user_id, subject_id, title, content, created_at
    FROM notes WHERE user_id = ? ORDER BY created_at DESC;
    ''', (user_id,))
    notes = [dict(r) for r in cursor.fetchall()]
    for n in notes:
        n['subjectId'] = n['subject_id']

    # Study Sessions (ONLY user's sessions)
    cursor.execute('''
    SELECT id, user_id, subject_id, duration_minutes, topic, date, created_at
    FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC;
    ''', (user_id,))
    study_sessions = [dict(r) for r in cursor.fetchall()]
    for ss in study_sessions:
        ss['subjectId'] = ss['subject_id']
        ss['durationMinutes'] = ss['duration_minutes']

    conn.close()

    ai_stats = get_user_ai_stats(user_id, user.get('ai_limit_per_period', 10))

    return json_response({
        "user": user,
        "tasks": tasks,
        "subjects": subjects,
        "exams": exams,
        "timetable": timetable,
        "notes": notes,
        "studySessions": study_sessions,
        "aiStats": ai_stats
    })

# ==============================================================================
# 3. TASKS CRUD (SECURELY ISOLATED)
# ==============================================================================

@app.route('/api/tasks', method='POST')
def create_task():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    task_id = 'task_' + datetime.now().strftime('%Y%m%d%H%M%S') + '_' + secrets.token_hex(3)
    title = (data.get('title') or '').strip()
    if not title:
        return json_response({"error": "VALIDATION_ERROR", "message": "عنوان المهمة مطلوب."}, 400)

    subject_id = data.get('subjectId') or data.get('subject_id') or ''
    due_date = data.get('dueDate') or data.get('due_date') or datetime.now().strftime('%Y-%m-%d')
    due_time = data.get('dueTime') or data.get('due_time') or '18:00'
    priority = data.get('priority') or 'medium'
    description = (data.get('description') or '').strip()
    notes = (data.get('notes') or '').strip()
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO tasks (id, user_id, title, subject_id, description, due_date, due_time, priority, completed, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);
    ''', (task_id, user['id'], title, subject_id, description, due_date, due_time, priority, notes, now, now))
    conn.commit()
    conn.close()

    new_task = {
        "id": task_id,
        "user_id": user['id'],
        "title": title,
        "subjectId": subject_id,
        "subject_id": subject_id,
        "description": description,
        "dueDate": due_date,
        "due_date": due_date,
        "dueTime": due_time,
        "due_time": due_time,
        "priority": priority,
        "completed": False,
        "notes": notes,
        "created_at": now
    }
    return json_response({"success": True, "task": new_task}, 201)

@app.route('/api/tasks/<task_id>', method='PUT')
def update_task(task_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    title = data.get('title')
    subject_id = data.get('subjectId') or data.get('subject_id')
    due_date = data.get('dueDate') or data.get('due_date')
    due_time = data.get('dueTime') or data.get('due_time')
    priority = data.get('priority')
    description = data.get('description')
    notes = data.get('notes')
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    # Check ownership
    cursor.execute("SELECT id FROM tasks WHERE id = ? AND user_id = ?;", (task_id, user['id']))
    if not cursor.fetchone():
        conn.close()
        return json_response({"error": "NOT_FOUND", "message": "المهمة غير موجودة."}, 404)

    cursor.execute('''
    UPDATE tasks
    SET title = COALESCE(?, title),
        subject_id = COALESCE(?, subject_id),
        due_date = COALESCE(?, due_date),
        due_time = COALESCE(?, due_time),
        priority = COALESCE(?, priority),
        description = COALESCE(?, description),
        notes = COALESCE(?, notes),
        updated_at = ?
    WHERE id = ? AND user_id = ?;
    ''', (title, subject_id, due_date, due_time, priority, description, notes, now, task_id, user['id']))
    conn.commit()
    conn.close()

    return json_response({"success": True, "message": "تم تحديث المهمة بنجاح."})

@app.route('/api/tasks/<task_id>/toggle', method='POST')
def toggle_task(task_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT completed FROM tasks WHERE id = ? AND user_id = ?;", (task_id, user['id']))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return json_response({"error": "NOT_FOUND", "message": "المهمة غير موجودة."}, 404)

    new_status = 0 if row['completed'] else 1
    completed_at = now_iso() if new_status else None
    cursor.execute('''
    UPDATE tasks SET completed = ?, completed_at = ?, updated_at = ?
    WHERE id = ? AND user_id = ?;
    ''', (new_status, completed_at, now_iso(), task_id, user['id']))
    conn.commit()
    conn.close()

    return json_response({"success": True, "completed": bool(new_status)})

@app.route('/api/tasks/<task_id>', method='DELETE')
def delete_task(task_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?;", (task_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف المهمة."})

# ==============================================================================
# 4. SUBJECTS CRUD (SECURELY ISOLATED)
# ==============================================================================

@app.route('/api/subjects', method='POST')
def create_subject():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    name = (data.get('name') or '').strip()
    if not name:
        return json_response({"error": "VALIDATION_ERROR", "message": "اسم المادة مطلوب."}, 400)

    sub_id = 'sub_' + secrets.token_hex(4)
    code = (data.get('code') or name[:3]).upper()
    color = data.get('color') or 'indigo'
    icon = data.get('icon') or 'book-open'
    teacher = (data.get('teacher') or 'معلم المادة').strip()
    description = (data.get('description') or '').strip()
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO subjects (id, user_id, name, code, color, icon, teacher, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    ''', (sub_id, user['id'], name, code, color, icon, teacher, description, now))
    conn.commit()
    conn.close()

    new_sub = {
        "id": sub_id,
        "name": name,
        "code": code,
        "color": color,
        "icon": icon,
        "teacher": teacher,
        "description": description,
        "bgLight": f"bg-{color}-50 text-{color}-700 border-{color}-200 dark:bg-{color}-950/40 dark:text-{color}-300 dark:border-{color}-800",
        "badgeColor": f"bg-{color}-500"
    }
    return json_response({"success": True, "subject": new_sub}, 201)

@app.route('/api/subjects/<sub_id>', method='DELETE')
def delete_subject(sub_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM subjects WHERE id = ? AND user_id = ?;", (sub_id, user['id']))
    cursor.execute("DELETE FROM tasks WHERE subject_id = ? AND user_id = ?;", (sub_id, user['id']))
    cursor.execute("DELETE FROM timetable WHERE subject_id = ? AND user_id = ?;", (sub_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف المادة بنجاح."})

# ==============================================================================
# 5. EXAMS & TIMETABLE & NOTES & STUDY SESSIONS
# ==============================================================================

@app.route('/api/exams', method='POST')
def create_exam():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    name = (data.get('name') or '').strip()
    if not name:
        return json_response({"error": "VALIDATION_ERROR", "message": "اسم الامتحان مطلوب."}, 400)

    exam_id = 'exam_' + secrets.token_hex(4)
    subject_id = data.get('subjectId') or data.get('subject_id') or ''
    date = data.get('date') or datetime.now().strftime('%Y-%m-%d')
    time = data.get('time') or '08:30'
    room = (data.get('room') or 'قاعة الاختبار').strip()
    notes = (data.get('notes') or '').strip()
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO exams (id, user_id, name, subject_id, date, time, room, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    ''', (exam_id, user['id'], name, subject_id, date, time, room, notes, now))
    conn.commit()
    conn.close()

    return json_response({"success": True, "exam": {
        "id": exam_id,
        "name": name,
        "subjectId": subject_id,
        "date": date,
        "time": time,
        "room": room,
        "notes": notes
    }}, 201)

@app.route('/api/exams/<exam_id>', method='DELETE')
def delete_exam(exam_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM exams WHERE id = ? AND user_id = ?;", (exam_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف موعد الامتحان."})

@app.route('/api/timetable', method='POST')
def create_timetable_slot():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    slot_id = 'slot_' + secrets.token_hex(4)
    day = data.get('day') or 'الأحد'
    period = data.get('period') or 'الحصة 1'
    subject_id = data.get('subjectId') or data.get('subject_id') or ''
    room = data.get('room') or 'فصل المدرسة'
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO timetable (id, user_id, day, period, subject_id, room, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    ''', (slot_id, user['id'], day, period, subject_id, room, now))
    conn.commit()
    conn.close()

    return json_response({"success": True, "slot": {
        "id": slot_id,
        "day": day,
        "period": period,
        "subjectId": subject_id,
        "room": room
    }}, 201)

@app.route('/api/timetable/<slot_id>', method='DELETE')
def delete_timetable_slot(slot_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM timetable WHERE id = ? AND user_id = ?;", (slot_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True})

@app.route('/api/notes', method='POST')
def create_note():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    title = (data.get('title') or '').strip()
    if not title:
        return json_response({"error": "VALIDATION_ERROR", "message": "عنوان الملاحظة مطلوب."}, 400)

    note_id = 'note_' + secrets.token_hex(4)
    subject_id = data.get('subjectId') or data.get('subject_id') or ''
    content = (data.get('content') or '').strip()
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO notes (id, user_id, subject_id, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    ''', (note_id, user['id'], subject_id, title, content, now))
    conn.commit()
    conn.close()

    return json_response({"success": True, "note": {
        "id": note_id,
        "subjectId": subject_id,
        "title": title,
        "content": content,
        "created_at": now
    }}, 201)

@app.route('/api/notes/<note_id>', method='DELETE')
def delete_note(note_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ? AND user_id = ?;", (note_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True})

@app.route('/api/study-sessions', method='POST')
def create_study_session():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    data = get_json_body()
    session_id = 'session_' + secrets.token_hex(4)
    subject_id = data.get('subjectId') or data.get('subject_id') or ''
    duration = int(data.get('durationMinutes') or data.get('duration_minutes') or 25)
    topic = (data.get('topic') or 'جلسة مذاكرة').strip()
    date = data.get('date') or datetime.now().strftime('%Y-%m-%d')
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO study_sessions (id, user_id, subject_id, duration_minutes, topic, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    ''', (session_id, user['id'], subject_id, duration, topic, date, now))
    conn.commit()
    conn.close()

    return json_response({"success": True, "session": {
        "id": session_id,
        "subjectId": subject_id,
        "durationMinutes": duration,
        "topic": topic,
        "date": date
    }}, 201)

# ==============================================================================
# 6. AI ASSISTANT & SERVER-ENFORCED USAGE LIMITS
# ==============================================================================

@app.route('/api/ai/process', method='POST')
def ai_process():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    # 1. Enforce AI usage limits strictly on server
    limit_check = check_ai_usage_limit(user)
    if not limit_check['allowed']:
        return json_response({
            "error": "AI_LIMIT_EXCEEDED",
            "message": limit_check['message'],
            "ai_stats": limit_check
        }, 403)

    data = get_json_body()
    action = data.get('action') or 'summarize'
    input_text = (data.get('text') or '').strip()

    if not input_text:
        return json_response({"error": "VALIDATION_ERROR", "message": "نص الدرس أو السؤال مطلوب."}, 400)

    # Record in AI history
    history_id = 'ai_' + secrets.token_hex(4)
    now = now_iso()
    preview = input_text[:100] + ('...' if len(input_text) > 100 else '')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO ai_history (id, user_id, action_type, title, input_preview, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    ''', (history_id, user['id'], action, f"طلب {action}", preview, now))
    conn.commit()
    conn.close()

    return json_response({
        "success": True,
        "action": action,
        "ai_stats": limit_check
    })

# ==============================================================================
# 7. PUBLIC PLANS ENDPOINT (read-only, sorted by percentage descending)
# ==============================================================================

@app.route('/api/plans', method='GET')
def get_plans_public():
    """Public endpoint: returns active plans sorted by percentage descending."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT id, name_ar, name_en, description, price, currency, percentage,
           duration_days, ai_limit_per_period, max_subjects, features,
           badge_label, color, sort_order, is_active
    FROM plans
    WHERE is_active = 1
    ORDER BY percentage DESC, sort_order ASC;
    ''')
    plans = []
    for r in cursor.fetchall():
        p = dict(r)
        try:
            p['features'] = json.loads(p['features'] or '[]')
        except Exception:
            p['features'] = []
        plans.append(p)
    conn.close()
    return json_response({"plans": plans})

# Plan upgrades are handled admin-only via /api/admin/users/:id/plan
# Self-service upgrade endpoint has been removed for security.

# ==============================================================================
# 8. ADMIN DASHBOARD & MANAGEMENT (STRICT SERVER-SIDE ROLE CHECK)
# ==============================================================================

@app.route('/api/admin/overview', method='GET')
def admin_overview():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM users;")
    total_users = cursor.fetchone()['total']
    cursor.execute("SELECT COUNT(*) as active FROM users WHERE account_status = 'active';")
    active_users = cursor.fetchone()['active']
    cursor.execute("SELECT COUNT(*) as suspended FROM users WHERE account_status = 'suspended';")
    suspended_users = cursor.fetchone()['suspended']
    cursor.execute("SELECT COUNT(*) as free FROM users WHERE plan_id = 'free';")
    free_users = cursor.fetchone()['free']
    cursor.execute("SELECT COUNT(*) as pro FROM users WHERE plan_id = 'pro';")
    pro_users = cursor.fetchone()['pro']
    cursor.execute("SELECT COUNT(*) as tasks FROM tasks;")
    total_tasks = cursor.fetchone()['tasks']
    cursor.execute("SELECT COALESCE(SUM(requests_used), 0) as ai_total FROM ai_usage;")
    total_ai_usage = cursor.fetchone()['ai_total']
    cursor.execute("SELECT COUNT(*) as cards FROM cards;")
    total_cards = cursor.fetchone()['cards']

    cursor.execute('''
    SELECT u.id, u.email, u.role, u.account_status, u.plan_id, u.created_at,
           p.name, p.school_level
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC LIMIT 10;
    ''')
    recent_users = [dict(r) for r in cursor.fetchall()]

    # Plan distribution
    cursor.execute('''
    SELECT plan_id, COUNT(*) as count FROM users GROUP BY plan_id ORDER BY count DESC;
    ''')
    plan_distribution = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return json_response({
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "suspended_users": suspended_users,
            "free_users": free_users,
            "pro_users": pro_users,
            "total_tasks": total_tasks,
            "total_ai_usage": total_ai_usage,
            "total_cards": total_cards,
        },
        "recent_users": recent_users,
        "plan_distribution": plan_distribution
    })

# ——— User Management ————————————————————————————————————————————————————————

@app.route('/api/admin/users', method='GET')
def admin_get_users():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    search = request.query.get('q', '').strip().lower()
    status_filter = request.query.get('status', 'all')
    plan_filter = request.query.get('plan', 'all')

    query = '''
    SELECT u.id, u.email, u.role, u.account_status, u.plan_id, u.card_id, u.created_at,
           p.name, p.school_level,
           (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as task_count,
           (SELECT COALESCE(SUM(requests_used), 0) FROM ai_usage WHERE user_id = u.id) as ai_used
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE 1=1
    '''
    params = []
    if search:
        query += " AND (u.email LIKE ? OR p.name LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if status_filter != 'all':
        query += " AND u.account_status = ?"
        params.append(status_filter)
    if plan_filter != 'all':
        query += " AND u.plan_id = ?"
        params.append(plan_filter)
    query += " ORDER BY u.created_at DESC;"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return json_response({"users": users})

@app.route('/api/admin/users/create', method='POST')
def admin_create_user():
    """Admin manually creates a user account with chosen plan."""
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    plan_id = (data.get('plan_id') or 'free').strip()
    school_level = (data.get('school_level') or 'الثاني المتوسط').strip()
    role = (data.get('role') or 'user').strip()

    if not name or not email or not password:
        return json_response({"error": "MISSING_FIELDS", "message": "يرجى إدخال الاسم والبريد وكلمة المرور."}, 400)
    if len(password) < 6:
        return json_response({"error": "WEAK_PASSWORD", "message": "كلمة المرور يجب أن تكون 6 أحرف على الأقل."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?;", (email,))
    if cursor.fetchone():
        conn.close()
        return json_response({"error": "EMAIL_EXISTS", "message": "هذا البريد الإلكتروني مسجل مسبقاً."}, 409)

    cursor.execute("SELECT id FROM plans WHERE id = ?;", (plan_id,))
    if not cursor.fetchone():
        plan_id = 'free'

    now = now_iso()
    pwd_hash, salt = hash_password(password)
    cursor.execute('''
    INSERT INTO users (email, password_hash, salt, role, account_status, plan_id, plan_status, plan_start_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, 'active', ?, ?, ?);
    ''', (email, pwd_hash, salt, role, plan_id, now, now, now))
    user_id = cursor.lastrowid
    cursor.execute('''
    INSERT INTO profiles (user_id, name, school_level, avatar, preferred_language, theme, updated_at)
    VALUES (?, ?, ?, '🎓', 'ar', 'light', ?);
    ''', (user_id, name, school_level, now))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم إنشاء حساب {name} بنجاح.", "user_id": user_id}, 201)

@app.route('/api/admin/users/<user_id:int>/plan', method='PUT')
def admin_update_user_plan(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    new_plan = (data.get('plan_id') or '').strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name_ar FROM plans WHERE id = ?;", (new_plan,))
    plan = cursor.fetchone()
    if not plan:
        conn.close()
        return json_response({"error": "INVALID_PLAN", "message": "الباقة المختارة غير موجودة في النظام."}, 400)

    now = now_iso()
    cursor.execute("UPDATE users SET plan_id = ?, plan_status = 'active', plan_start_date = ?, updated_at = ? WHERE id = ?;",
                   (new_plan, now, now, user_id))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم تعديل باقة المستخدم إلى {plan['name_ar']}."})

@app.route('/api/admin/users/<user_id:int>/status', method='PUT')
def admin_update_user_status(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    if user_id == admin['id']:
        return json_response({"error": "CANNOT_MODIFY_SELF", "message": "لا يمكنك تغيير حالة حسابك الإداري الخاص."}, 400)

    data = get_json_body()
    new_status = data.get('status')
    if new_status not in ['active', 'suspended', 'deleted']:
        return json_response({"error": "INVALID_STATUS", "message": "حالة حساب غير صالحة."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?;", (new_status, now_iso(), user_id))
    if new_status in ['suspended', 'deleted']:
        cursor.execute("DELETE FROM sessions WHERE user_id = ?;", (user_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم تعديل حالة الحساب إلى {new_status} بنجاح."})

@app.route('/api/admin/users/<user_id:int>/reset-data', method='POST')
def admin_reset_user_data(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    for tbl in ['tasks', 'subjects', 'exams', 'timetable', 'notes', 'study_sessions', 'ai_history']:
        cursor.execute(f"DELETE FROM {tbl} WHERE user_id = ?;", (user_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم تصفير جميع بيانات الطالب بنجاح."})

@app.route('/api/admin/users/<user_id:int>', method='DELETE')
def admin_delete_user(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    if user_id == admin['id']:
        return json_response({"error": "CANNOT_DELETE_SELF", "message": "لا يمكنك حذف حساب المدير الخاص بك."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?;", (user_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف الحساب نهائياً من النظام."})

@app.route('/api/admin/users/<user_id:int>/warning', method='POST')
def admin_send_warning(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    message = (data.get('message') or '').strip()
    if not message:
        return json_response({"error": "EMPTY_MESSAGE", "message": "يرجى كتابة نص التحذير."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?;", (user_id,))
    if not cursor.fetchone():
        conn.close()
        return json_response({"error": "NOT_FOUND", "message": "المستخدم غير موجود."}, 404)

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("INSERT INTO warnings (user_id, message, sent_by, created_at) VALUES (?, ?, ?, ?);",
                   (user_id, message, admin['id'], now))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم إرسال التحذير بنجاح."}, 201)

@app.route('/api/warnings/check', method='GET')
def check_warnings():
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, message, created_at FROM warnings WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 1;",
                   (user['id'],))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json_response({"warning": {"id": row["id"], "message": row["message"], "created_at": row["created_at"]}})
    return json_response({"warning": None})

@app.route('/api/warnings/<warning_id:int>/read', method='POST')
def dismiss_warning(warning_id):
    user = require_auth()
    if isinstance(user, dict) and "error" in user:
        return json_response(user, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE warnings SET is_read = 1 WHERE id = ? AND user_id = ?;", (warning_id, user['id']))
    conn.commit()
    conn.close()
    return json_response({"success": True})

@app.route('/api/admin/users/<user_id:int>/permissions', method='GET')
def admin_get_user_permissions(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_permissions WHERE user_id = ?;", (user_id,))
    perms = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return json_response({"permissions": perms})

@app.route('/api/admin/users/<user_id:int>/permissions', method='POST')
def admin_grant_permission(user_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    permission = (data.get('permission') or '').strip()
    expires_at = data.get('expires_at')
    if not permission:
        return json_response({"error": "MISSING_PERMISSION", "message": "يرجى تحديد اسم الصلاحية."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO user_permissions (user_id, permission, granted_by, granted_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, permission) DO UPDATE SET granted_by=excluded.granted_by, granted_at=excluded.granted_at, expires_at=excluded.expires_at;
    ''', (user_id, permission, admin['id'], now_iso(), expires_at))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم منح صلاحية '{permission}' بنجاح."})

@app.route('/api/admin/users/<user_id:int>/permissions/<permission>', method='DELETE')
def admin_revoke_permission(user_id, permission):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_permissions WHERE user_id = ? AND permission = ?;", (user_id, permission))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم سحب صلاحية '{permission}'."})

# ——— Plans CRUD ——————————————————————————————————————————————————————————————

@app.route('/api/admin/plans', method='GET')
def admin_get_plans():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT *, (SELECT COUNT(*) FROM users WHERE plan_id = plans.id) as user_count
    FROM plans ORDER BY percentage DESC, sort_order ASC;
    ''')
    plans = []
    for r in cursor.fetchall():
        p = dict(r)
        try:
            p['features'] = json.loads(p['features'] or '[]')
        except Exception:
            p['features'] = []
        plans.append(p)
    conn.close()
    return json_response({"plans": plans})

@app.route('/api/admin/plans', method='POST')
def admin_create_plan():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    plan_id = (data.get('id') or secrets.token_hex(4)).strip().lower()
    name_ar = (data.get('name_ar') or '').strip()
    if not name_ar:
        return json_response({"error": "MISSING_NAME", "message": "اسم الباقة مطلوب."}, 400)

    features = data.get('features', [])
    if isinstance(features, str):
        features = [f.strip() for f in features.split('\n') if f.strip()]

    percentage = int(data.get('percentage') or 0)
    now = now_iso()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM plans WHERE id = ?;", (plan_id,))
    if cursor.fetchone():
        # Generate a unique suffix; loop until we find an unused ID
        while True:
            plan_id = plan_id + '_' + secrets.token_hex(2)
            cursor.execute("SELECT id FROM plans WHERE id = ?;", (plan_id,))
            if not cursor.fetchone():
                break

    cursor.execute('''
    INSERT INTO plans (id, name_ar, name_en, description, price, currency, percentage,
                       duration_days, ai_limit_per_period, max_subjects, features,
                       badge_label, color, sort_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);
    ''', (
        plan_id, name_ar,
        (data.get('name_en') or name_ar).strip(),
        (data.get('description') or '').strip(),
        float(data.get('price') or 0),
        (data.get('currency') or 'SAR').strip(),
        percentage,
        int(data.get('duration_days') or 0),
        int(data.get('ai_limit_per_period') or 10),
        int(data.get('max_subjects') or 10),
        json.dumps(features, ensure_ascii=False),
        (data.get('badge_label') or '').strip(),
        (data.get('color') or 'emerald').strip(),
        int(data.get('sort_order') or (100 - percentage)),
        now, now
    ))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم إنشاء الباقة '{name_ar}' بنجاح.", "plan_id": plan_id}, 201)

@app.route('/api/admin/plans/<plan_id>', method='PUT')
def admin_update_plan(plan_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    now = now_iso()

    features = data.get('features')
    if features is not None:
        if isinstance(features, str):
            features = [f.strip() for f in features.split('\n') if f.strip()]
        features_json = json.dumps(features, ensure_ascii=False)
    else:
        features_json = None

    conn = get_db()
    cursor = conn.cursor()
    updates, params = [], []

    field_map = {
        'name_ar': str, 'name_en': str, 'description': str,
        'price': float, 'currency': str, 'percentage': int,
        'duration_days': int, 'ai_limit_per_period': int,
        'max_subjects': int, 'badge_label': str, 'color': str,
        'sort_order': int, 'is_active': int
    }
    for field, ftype in field_map.items():
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            params.append(ftype(data[field]))

    if features_json is not None:
        updates.append("features = ?")
        params.append(features_json)

    # Auto-recalc sort_order if percentage changed
    if 'percentage' in data and 'sort_order' not in data:
        updates.append("sort_order = ?")
        params.append(100 - int(data['percentage']))

    updates.append("updated_at = ?")
    params.append(now)
    params.append(plan_id)

    if updates:
        cursor.execute(f"UPDATE plans SET {', '.join(updates)} WHERE id = ?;", params)
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم تحديث الباقة بنجاح."})

@app.route('/api/admin/plans/<plan_id>', method='DELETE')
def admin_delete_plan(plan_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    if plan_id == 'free':
        return json_response({"error": "CANNOT_DELETE_DEFAULT", "message": "لا يمكن حذف الباقة المجانية الافتراضية."}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET plan_id = 'free' WHERE plan_id = ?;", (plan_id,))
    cursor.execute("DELETE FROM plans WHERE id = ?;", (plan_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف الباقة وتحويل مستخدميها للباقة المجانية."})

@app.route('/api/admin/plans/<plan_id>/toggle', method='PUT')
def admin_toggle_plan(plan_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_active FROM plans WHERE id = ?;", (plan_id,))
    plan = cursor.fetchone()
    if not plan:
        conn.close()
        return json_response({"error": "NOT_FOUND"}, 404)
    new_state = 0 if plan['is_active'] else 1
    cursor.execute("UPDATE plans SET is_active = ?, updated_at = ? WHERE id = ?;", (new_state, now_iso(), plan_id))
    conn.commit()
    conn.close()
    return json_response({"success": True, "is_active": new_state,
                          "message": "تم تفعيل الباقة." if new_state else "تم تعطيل الباقة."})

# ——— Cards Management ————————————————————————————————————————————————————————

@app.route('/api/admin/cards', method='GET')
def admin_get_cards():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    search = request.query.get('q', '').strip().lower()
    query = '''
    SELECT c.*, p.name_ar as plan_name_ar,
           u.email as assigned_to_email,
           pr.name as assigned_to_name
    FROM cards c
    LEFT JOIN plans p ON p.id = c.plan_id
    LEFT JOIN users u ON u.id = c.assigned_to
    LEFT JOIN profiles pr ON pr.user_id = c.assigned_to
    WHERE 1=1
    '''
    params = []
    if search:
        query += " AND (c.code LIKE ? OR c.label LIKE ? OR u.email LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    query += " ORDER BY c.created_at DESC;"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    cards = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return json_response({"cards": cards})

@app.route('/api/admin/cards', method='POST')
def admin_create_card():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    code = (data.get('code') or secrets.token_hex(6).upper()).strip().upper()
    label = (data.get('label') or f'بطاقة {code}').strip()
    card_type = (data.get('card_type') or 'plan_upgrade').strip()
    plan_id = (data.get('plan_id') or '').strip() or None
    ai_bonus = int(data.get('ai_bonus') or 0)
    duration_days = int(data.get('duration_days') or 0)
    now = now_iso()
    card_id = 'card_' + secrets.token_hex(6)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT code FROM cards WHERE code = ?;", (code,))
    if cursor.fetchone():
        conn.close()
        return json_response({"error": "CODE_EXISTS", "message": "رمز البطاقة هذا موجود مسبقاً."}, 409)

    cursor.execute('''
    INSERT INTO cards (id, code, label, card_type, plan_id, ai_bonus, duration_days,
                       is_active, is_used, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?);
    ''', (card_id, code, label, card_type, plan_id, ai_bonus, duration_days, admin['id'], now))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": f"تم إنشاء البطاقة '{code}' بنجاح.", "card_id": card_id}, 201)

@app.route('/api/admin/cards/<card_id>/assign', method='PUT')
def admin_assign_card(card_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    user_id = data.get('user_id')
    if not user_id:
        return json_response({"error": "MISSING_USER"}, 400)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cards WHERE id = ?;", (card_id,))
    card = cursor.fetchone()
    if not card:
        conn.close()
        return json_response({"error": "NOT_FOUND"}, 404)
    if not card['is_active']:
        conn.close()
        return json_response({"error": "CARD_INACTIVE", "message": "هذه البطاقة معطلة."}, 400)

    now = now_iso()
    cursor.execute("UPDATE cards SET assigned_to = ?, assigned_at = ? WHERE id = ?;", (user_id, now, card_id))
    cursor.execute("UPDATE users SET card_id = ? WHERE id = ?;", (card_id, user_id))

    if card['card_type'] == 'plan_upgrade' and card['plan_id']:
        cursor.execute("UPDATE users SET plan_id = ?, plan_status = 'active', plan_start_date = ?, updated_at = ? WHERE id = ?;",
                       (card['plan_id'], now, now, user_id))
    if card['ai_bonus'] and card['ai_bonus'] > 0:
        cursor.execute("UPDATE users SET ai_bonus = COALESCE(ai_bonus, 0) + ? WHERE id = ?;", (card['ai_bonus'], user_id))

    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم منح البطاقة للمستخدم بنجاح."})

@app.route('/api/admin/cards/<card_id>/revoke', method='PUT')
def admin_revoke_card(card_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cards WHERE id = ?;", (card_id,))
    card = cursor.fetchone()
    if not card:
        conn.close()
        return json_response({"error": "NOT_FOUND"}, 404)

    if card['assigned_to']:
        cursor.execute("UPDATE users SET card_id = NULL WHERE id = ? AND card_id = ?;", (card['assigned_to'], card_id))
        if card['card_type'] == 'plan_upgrade' and card['plan_id']:
            cursor.execute("UPDATE users SET plan_id = 'free', updated_at = ? WHERE id = ? AND plan_id = ?;",
                           (now_iso(), card['assigned_to'], card['plan_id']))

    cursor.execute("UPDATE cards SET assigned_to = NULL, assigned_at = NULL WHERE id = ?;", (card_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم سحب البطاقة من المستخدم."})

@app.route('/api/admin/cards/<card_id>/toggle', method='PUT')
def admin_toggle_card(card_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_active FROM cards WHERE id = ?;", (card_id,))
    card = cursor.fetchone()
    if not card:
        conn.close()
        return json_response({"error": "NOT_FOUND"}, 404)
    new_state = 0 if card['is_active'] else 1
    cursor.execute("UPDATE cards SET is_active = ? WHERE id = ?;", (new_state, card_id))
    conn.commit()
    conn.close()
    return json_response({"success": True, "is_active": new_state,
                          "message": "تم تفعيل البطاقة." if new_state else "تم تعطيل البطاقة."})

@app.route('/api/admin/cards/<card_id>', method='DELETE')
def admin_delete_card(card_id):
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT assigned_to FROM cards WHERE id = ?;", (card_id,))
    card = cursor.fetchone()
    if card and card['assigned_to']:
        cursor.execute("UPDATE users SET card_id = NULL WHERE id = ? AND card_id = ?;", (card['assigned_to'], card_id))
    cursor.execute("DELETE FROM cards WHERE id = ?;", (card_id,))
    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حذف البطاقة نهائياً."})

# ——— System Settings ————————————————————————————————————————————————————————

@app.route('/api/admin/settings', method='GET')
def admin_get_settings():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM system_settings;")
    settings = {r['key']: r['value'] for r in cursor.fetchall()}
    conn.close()

    if settings.get('gemini_api_key'):
        raw = settings['gemini_api_key']
        settings['gemini_api_key_masked'] = raw[:6] + '...' + raw[-4:] if len(raw) > 10 else '******'
    else:
        settings['gemini_api_key_masked'] = ''

    return json_response({"settings": settings})

@app.route('/api/admin/settings', method='PUT')
def admin_update_settings():
    admin = require_admin()
    if isinstance(admin, dict) and "error" in admin:
        return json_response(admin, response.status)

    data = get_json_body()
    conn = get_db()
    cursor = conn.cursor()

    for k, v in data.items():
        if k in ['app_name', 'allow_registration', 'gemini_api_key']:
            cursor.execute('''
            INSERT INTO system_settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value;
            ''', (k, str(v).strip()))

    conn.commit()
    conn.close()
    return json_response({"success": True, "message": "تم حفظ إعدادات النظام بنجاح."})

# ==============================================================================
# 9. STATIC FILES SERVING
# ==============================================================================

@app.route('/')
def serve_index():
    return static_file('index.html', root=BASE_DIR)

@app.route('/admin')
def serve_admin():
    return static_file('index.html', root=BASE_DIR)

@app.route('/<filename:path>')
def serve_static(filename):
    return static_file(filename, root=BASE_DIR)

if __name__ == '__main__':
    import os as _os
    port = int(_os.environ.get('PORT', '8080'))
    print(f"Starting Munjizi Multi-User Server on http://0.0.0.0:{port} ...")
    app.run(host='0.0.0.0', port=port, reloader=False, quiet=False)
