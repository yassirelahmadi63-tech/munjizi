// User Profile and Settings Component for Munjizi
import { store } from '../store.js';
import { api } from '../api.js';

export function renderProfile(container, onNavigate) {
  const user = store.state.user;
  if (!user) return;

  const aiStats = store.state.aiStats || { requests_used: 0, requests_limit: 10, requests_remaining: 10 };

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      
      <!-- Top Title -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
            الملف الشخصي وإعدادات الحساب
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            إدارة بياناتك الدراسية، باقة اشتراكك، وتفضيلات الأمان والمظهر.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-upgrade-plan-cta" class="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5">
            <i data-lucide="crown" class="w-4 h-4"></i>
            <span>ترقية الباقة (PRO)</span>
          </button>
          <button id="btn-profile-logout" class="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-100 transition flex items-center gap-1.5">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      <!-- User Card Header -->
      <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
            ${user.avatar || '🎓'}
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${user.plan_id === 'pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}">
                ${user.plan_name_ar || (user.plan_id === 'pro' ? 'باقة المتفوقين (PRO)' : 'الباقة المجانية')}
              </span>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${user.account_status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}">
                ${user.account_status === 'active' ? 'حساب نشط' : 'معلّق'}
              </span>
              ${user.role === 'admin' ? `<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">مشرف النظام</span>` : ''}
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white font-heading">
              ${user.name}
            </h2>
            <p class="text-xs text-gray-400" dir="ltr">
              ${user.email}
            </p>
          </div>
        </div>

        <!-- AI Quota Card -->
        <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-right sm:w-64">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-gray-700 dark:text-gray-300">رصيد المساعد الذكي (AI)</span>
            <span class="font-mono text-emerald-600 font-bold">${aiStats.requests_remaining} طلب متبقي</span>
          </div>
          <div class="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full" style="width: ${Math.min(100, Math.round((aiStats.requests_used / aiStats.requests_limit) * 100))}%;"></div>
          </div>
          <span class="text-[10px] text-gray-400 block mt-1.5">تم استهلاك ${aiStats.requests_used} من ${aiStats.requests_limit} طلباً في الفترة الحالية.</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- 1. Edit Profile Form -->
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <i data-lucide="user" class="w-4 h-4 text-emerald-600"></i>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">تعديل البيانات الأساسية</h3>
          </div>

          <form id="form-edit-profile" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
              <input type="text" id="prof-name" value="${user.name}" required class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الصف / المرحلة الدراسية</label>
              <select id="prof-grade" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="الأول المتوسط" ${user.school_level === 'الأول المتوسط' ? 'selected' : ''}>الصف الأول المتوسط</option>
                <option value="الثاني المتوسط" ${user.school_level === 'الثاني المتوسط' ? 'selected' : ''}>الصف الثاني المتوسط</option>
                <option value="الثالث المتوسط" ${user.school_level === 'الثالث المتوسط' ? 'selected' : ''}>الصف الثالث المتوسط</option>
                <option value="المرحلة الابتدائية" ${user.school_level === 'المرحلة الابتدائية' ? 'selected' : ''}>المرحلة الابتدائية</option>
                <option value="المرحلة الثانوية" ${user.school_level === 'المرحلة الثانوية' ? 'selected' : ''}>المرحلة الثانوية</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الأيقونة الرمزية (Emoji)</label>
              <input type="text" id="prof-avatar" value="${user.avatar || '🎓'}" maxlength="2" class="w-20 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <button type="submit" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition">
              حفظ تعديلات الملف
            </button>
          </form>
        </div>

        <!-- 2. Security & Change Password Form -->
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <i data-lucide="lock" class="w-4 h-4 text-emerald-600"></i>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">تغيير كلمة المرور والأمان</h3>
          </div>

          <form id="form-change-pwd" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية</label>
              <input type="password" id="pwd-old" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة (6 أحرف على الأقل)</label>
              <input type="password" id="pwd-new" required minlength="6" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <button type="submit" class="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md transition">
              تحديث كلمة المرور
            </button>
          </form>
        </div>

      </div>

      <!-- App Preferences Section (Theme, Notifications, Language) -->
      <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
          <i data-lucide="sliders" class="w-4 h-4 text-emerald-600"></i>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">تفضيلات التطبيق والمظهر</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 block">المظهر العام</span>
              <span class="text-[11px] text-gray-400">فاتح / داكن</span>
            </div>
            <button id="btn-toggle-theme-prof" class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-xs font-bold">
              تبديل المظهر
            </button>
          </div>

          <div class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 block">لغة الواجهة</span>
              <span class="text-[11px] text-gray-400">العربية (RTL)</span>
            </div>
            <span class="text-xs font-bold text-emerald-600">افتراضي</span>
          </div>

          <div class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 block">التنبيهات المدرسية</span>
              <span class="text-[11px] text-gray-400">إشعارات المتصفح</span>
            </div>
            <span class="text-xs font-bold text-emerald-600">مفعّلة</span>
          </div>
        </div>
      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Upgrade Plan CTA
  container.querySelector('#btn-upgrade-plan-cta')?.addEventListener('click', () => {
    if (onNavigate) onNavigate('plans');
  });

  // Logout
  container.querySelector('#btn-profile-logout')?.addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
      await store.logout();
      location.reload();
    }
  });

  // Profile Form Submit
  container.querySelector('#form-edit-profile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#prof-name').value.trim();
    const schoolLevel = container.querySelector('#prof-grade').value;
    const avatar = container.querySelector('#prof-avatar').value.trim();

    try {
      await api.updateProfile({ name, school_level: schoolLevel, avatar });
      alert('تم تحديث الملف الشخصي بنجاح!');
      renderProfile(container, onNavigate);
    } catch (err) {
      alert(err.message || 'فشل التحديث');
    }
  });

  // Change Password Submit
  container.querySelector('#form-change-pwd')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPwd = container.querySelector('#pwd-old').value.trim();
    const newPwd = container.querySelector('#pwd-new').value.trim();

    try {
      await api.changePassword(oldPwd, newPwd);
      alert('تم تغيير كلمة المرور بنجاح!');
      container.querySelector('#pwd-old').value = '';
      container.querySelector('#pwd-new').value = '';
    } catch (err) {
      alert(err.message || 'فشل تغيير كلمة المرور');
    }
  });

  // Theme Toggle in Profile
  container.querySelector('#btn-toggle-theme-prof')?.addEventListener('click', () => {
    store.toggleTheme();
  });
}
