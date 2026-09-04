# Database initialization and management for Munjizi
import sqlite3
import os
import hashlib
import secrets
import json
from datetime import datetime, timedelta

DB_PATH = os.environ.get('DATABASE_URL') or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'munjizi.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def hash_password(password: str, salt: str = None) -> tuple:
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    pwd_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(pwd_hash, stored_hash)

def _safe_alter(cursor, table, column, col_def):
    """Add a column only if it doesn't already exist."""
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_def};")
    except Exception:
        pass  # Column already exists

def init_database():
    conn = get_db()
    cursor = conn.cursor()

    # =========================================================================
    # 1. Users table
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        account_status TEXT DEFAULT 'active',
        plan_id TEXT DEFAULT 'free',
        plan_status TEXT DEFAULT 'active',
        plan_start_date TEXT,
        plan_expiration_date TEXT,
        card_id TEXT,
        ai_bonus INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    ''')
    # Safe upgrades for existing databases
    _safe_alter(cursor, 'users', 'card_id', 'TEXT')
    _safe_alter(cursor, 'users', 'ai_bonus', 'INTEGER DEFAULT 0')

    # =========================================================================
    # 2. Profiles table
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        school_level TEXT DEFAULT 'الثاني المتوسط',
        avatar TEXT DEFAULT '🎓',
        preferred_language TEXT DEFAULT 'ar',
        theme TEXT DEFAULT 'light',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 3. Sessions table
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 4. Plans table — FULLY DYNAMIC
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        currency TEXT DEFAULT 'SAR',
        percentage INTEGER DEFAULT 0,
        duration_days INTEGER DEFAULT 0,
        ai_limit_per_period INTEGER DEFAULT 10,
        max_subjects INTEGER DEFAULT 10,
        features TEXT DEFAULT '[]',
        badge_label TEXT DEFAULT '',
        color TEXT DEFAULT 'emerald',
        sort_order INTEGER DEFAULT 999,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT
    );
    ''')
    # Safe upgrades for existing plan rows
    _safe_alter(cursor, 'plans', 'price', 'REAL DEFAULT 0')
    _safe_alter(cursor, 'plans', 'currency', "TEXT DEFAULT 'SAR'")
    _safe_alter(cursor, 'plans', 'percentage', 'INTEGER DEFAULT 0')
    _safe_alter(cursor, 'plans', 'duration_days', 'INTEGER DEFAULT 0')
    _safe_alter(cursor, 'plans', 'features', "TEXT DEFAULT '[]'")
    _safe_alter(cursor, 'plans', 'badge_label', "TEXT DEFAULT ''")
    _safe_alter(cursor, 'plans', 'color', "TEXT DEFAULT 'emerald'")
    _safe_alter(cursor, 'plans', 'sort_order', 'INTEGER DEFAULT 999')
    _safe_alter(cursor, 'plans', 'updated_at', 'TEXT')

    # =========================================================================
    # 5. AI usage tracking
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ai_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        requests_used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 6. Cards table — NEW: Admin creates and assigns cards
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        label TEXT,
        card_type TEXT DEFAULT 'plan_upgrade',
        plan_id TEXT,
        ai_bonus INTEGER DEFAULT 0,
        duration_days INTEGER DEFAULT 0,
        assigned_to INTEGER,
        assigned_at TEXT,
        is_active INTEGER DEFAULT 1,
        is_used INTEGER DEFAULT 0,
        used_at TEXT,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 7. User Permissions table — NEW: Per-user custom permissions
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission TEXT NOT NULL,
        granted_by INTEGER,
        granted_at TEXT NOT NULL,
        expires_at TEXT,
        UNIQUE(user_id, permission),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 8. User Tasks
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        subject_id TEXT,
        description TEXT,
        due_date TEXT,
        due_time TEXT,
        priority TEXT DEFAULT 'medium',
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 9. User Subjects
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        color TEXT,
        icon TEXT,
        teacher TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 10. User Exams
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        subject_id TEXT,
        date TEXT,
        time TEXT,
        room TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 11. User Timetable
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS timetable (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        day TEXT NOT NULL,
        period TEXT NOT NULL,
        subject_id TEXT,
        room TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 12. User Notes
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject_id TEXT,
        title TEXT NOT NULL,
        content TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 13. User Study Sessions
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject_id TEXT,
        duration_minutes INTEGER NOT NULL,
        topic TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 14. AI History
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ai_history (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        title TEXT,
        input_preview TEXT,
        result_data TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 15. Password Resets
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS password_resets (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # 16. System Settings
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    ''')

    # =========================================================================
    # 17. Admin Warnings
    # =========================================================================
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent_by INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (sent_by) REFERENCES users (id) ON DELETE CASCADE
    );
    ''')

    # =========================================================================
    # SEED: Default Plans (dynamic, fully featured)
    # =========================================================================
    now = datetime.utcnow().isoformat()

    default_plans = [
        {
            'id': 'free',
            'name_ar': 'الباقة المجانية',
            'name_en': 'Free Plan',
            'description': 'الأساسيات لتنظيم حياتك الدراسية',
            'price': 0,
            'currency': 'SAR',
            'percentage': 25,
            'duration_days': 0,
            'ai_limit_per_period': 10,
            'max_subjects': 10,
            'features': json.dumps([
                'إدارة المهام والواجبات المدرسية',
                'إضافة حتى 10 مواد دراسية',
                'جدول الامتحانات والعد التنازلي',
                'الجدول الأسبوعي الدراسي',
                'إحصائيات الإنجاز الأساسية',
                '10 طلبات ذكاء اصطناعي شهرياً'
            ], ensure_ascii=False),
            'badge_label': '',
            'color': 'gray',
            'sort_order': 4,
            'is_active': 1,
        },
        {
            'id': 'basic',
            'name_ar': 'الباقة الأساسية',
            'name_en': 'Basic Plan',
            'description': 'للطلاب الجادين في التنظيم والدراسة',
            'price': 9,
            'currency': 'SAR',
            'percentage': 50,
            'duration_days': 30,
            'ai_limit_per_period': 50,
            'max_subjects': 20,
            'features': json.dumps([
                'كل مميزات الباقة المجانية',
                'حتى 20 مادة دراسية',
                '50 طلب ذكاء اصطناعي شهرياً',
                'ملاحظات ذكية للمواد',
                'تصدير البيانات بصيغة JSON',
                'إحصائيات أسبوعية مفصلة'
            ], ensure_ascii=False),
            'badge_label': '',
            'color': 'blue',
            'sort_order': 3,
            'is_active': 1,
        },
        {
            'id': 'pro',
            'name_ar': 'باقة المتفوقين',
            'name_en': 'Pro Plan',
            'description': 'أقصى استفادة من الذكاء الاصطناعي والتحليلات',
            'price': 29,
            'currency': 'SAR',
            'percentage': 75,
            'duration_days': 30,
            'ai_limit_per_period': 200,
            'max_subjects': 50,
            'features': json.dumps([
                'كل مميزات الباقة الأساسية',
                'مواد دراسية لا محدودة',
                '200 طلب ذكاء اصطناعي شهرياً',
                'تلخيص وتبسيط شامل للدروس',
                'كويزات تفاعلية لا محدودة',
                'خطط مذاكرة ديناميكية',
                'إحصائيات تحليلية متقدمة',
                'دعم أولوي'
            ], ensure_ascii=False),
            'badge_label': 'الأشهر',
            'color': 'amber',
            'sort_order': 2,
            'is_active': 1,
        },
        {
            'id': 'elite',
            'name_ar': 'باقة النخبة',
            'name_en': 'Elite Plan',
            'description': 'للمتفوقين الذين يريدون كل شيء بلا حدود',
            'price': 59,
            'currency': 'SAR',
            'percentage': 100,
            'duration_days': 30,
            'ai_limit_per_period': 1000,
            'max_subjects': 0,
            'features': json.dumps([
                'كل مميزات باقة المتفوقين',
                'ذكاء اصطناعي غير محدود (1000 طلب)',
                'وصول مبكر لجميع الميزات الجديدة',
                'تقارير دراسية شهرية شاملة',
                'جلسات مذاكرة مخصصة',
                'شارة نخبة على الحساب',
                'دعم على مدار الساعة'
            ], ensure_ascii=False),
            'badge_label': 'النخبة',
            'color': 'purple',
            'sort_order': 1,
            'is_active': 1,
        }
    ]

    for plan in default_plans:
        cursor.execute('''
        INSERT OR IGNORE INTO plans
        (id, name_ar, name_en, description, price, currency, percentage, duration_days,
         ai_limit_per_period, max_subjects, features, badge_label, color, sort_order,
         is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            plan['id'], plan['name_ar'], plan['name_en'], plan['description'],
            plan['price'], plan['currency'], plan['percentage'], plan['duration_days'],
            plan['ai_limit_per_period'], plan['max_subjects'], plan['features'],
            plan['badge_label'], plan['color'], plan['sort_order'],
            plan['is_active'], now, now
        ))

    # =========================================================================
    # SEED: Default System Settings
    # =========================================================================
    default_settings = [
        ('app_name', 'مُنجزي'),
        ('allow_registration', 'true'),
        ('gemini_api_key', ''),
        ('maintenance_mode', 'false'),
        ('default_plan_id', 'free'),
        ('max_free_tasks', '100'),
    ]
    for key, value in default_settings:
        cursor.execute("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?);", (key, value))

    # =========================================================================
    # SEED: Default Administrator (via environment variables, no hardcoded creds)
    # =========================================================================
    # If ADMIN_EMAIL and ADMIN_PASSWORD env vars are set AND no admin exists yet,
    # create the initial administrator. This keeps credentials out of the code.
    admin_email = os.environ.get('ADMIN_EMAIL', '').strip().lower()
    admin_password = os.environ.get('ADMIN_PASSWORD', '').strip()
    if admin_email and admin_password:
        cursor.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'admin';")
        if cursor.fetchone()['c'] == 0:
            from datetime import datetime as _dt
            _now = _dt.utcnow().isoformat()
            _pwd_hash, _salt = hash_password(admin_password)
            cursor.execute('''
                INSERT INTO users (email, password_hash, salt, role, account_status, plan_id, plan_status, plan_start_date, created_at, updated_at)
                VALUES (?, ?, ?, 'admin', 'active', 'unlimited', 'active', ?, ?, ?);
            ''', (admin_email, _pwd_hash, _salt, _now, _now, _now))
            cursor.execute("INSERT OR IGNORE INTO profiles (user_id, name, school_level) SELECT id, 'مدير النظام', 'admin' FROM users WHERE email = ?;", (admin_email,))
            print(f"Initial administrator created for {admin_email} from environment variables.")

    conn.commit()
    conn.close()
    print("Database initialized with dynamic plans, cards, and permissions.")

if __name__ == '__main__':
    init_database()
