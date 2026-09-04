// Admin Dashboard Component for Munjizi
// Server-Enforced RBAC: Only admin role allowed
import { store } from '../store.js';
import { api } from '../api.js';

let activeAdminTab = 'overview'; // 'overview', 'users', 'plans', 'settings'
let cachedUsers = [];
let searchQuery = '';
let statusFilter = 'all';
let planFilter = 'all';

export async function renderAdmin(container, onNavigate) {
  // 1. Client pre-check
  if (!store.state.user || store.state.user.role !== 'admin') {
    container.innerHTML = `
      <div class="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 max-w-lg mx-auto space-y-3">
        <div class="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <i data-lucide="shield-x" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white font-heading">وصول محظور (403 Forbidden)</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          هذا القسم مخصص حصرياً لمدراء النظام. لا تملك الصلاحية الكافية للوصول إليه.
        </p>
        <button id="btn-back-from-admin" class="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
          العودة للوحة تحكم الطالب
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    container.querySelector('#btn-back-from-admin')?.addEventListener('click', () => onNavigate('dashboard'));
    return;
  }

  // 2. Fetch admin data from server
  let overviewData = null;
  try {
    overviewData = await api.adminGetOverview();
  } catch (err) {
    container.innerHTML = `
      <div class="p-8 text-center text-rose-600 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200">
        فشل تحميل بيانات الإدارة: ${err.message}
      </div>
    `;
    return;
  }

  const stats = overviewData.stats;
  const recentUsers = overviewData.recent_users;

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Top Admin Header -->
      <div class="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-900/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold mb-1">
              <i data-lucide="shield-check" class="w-3 h-3"></i>
              <span>لوحة التحكم الإدارية الآمنة</span>
            </div>
            <h1 class="text-2xl font-extrabold font-heading">
              إدارة منصة مُنجزي
            </h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-return-app" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5">
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
            <span>العودة لتطبيق الطالب</span>
          </button>
        </div>
      </div>

      <!-- Admin Sub-Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none border-b border-gray-200 dark:border-gray-800">
        <button class="admin-tab px-4 py-2.5 rounded-2xl transition ${activeAdminTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="overview">
          <i data-lucide="layout-dashboard" class="w-4 h-4 inline ml-1"></i>
          <span>نظرة عامة</span>
        </button>
        <button class="admin-tab px-4 py-2.5 rounded-2xl transition ${activeAdminTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="users">
          <i data-lucide="users" class="w-4 h-4 inline ml-1"></i>
          <span>إدارة المستخدمين (${stats.total_users})</span>
        </button>
        <button class="admin-tab px-4 py-2.5 rounded-2xl transition ${activeAdminTab === 'plans' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="plans">
          <i data-lucide="layers" class="w-4 h-4 inline ml-1"></i>
          <span>إدارة الباقات والـ AI</span>
        </button>
        <button class="admin-tab px-4 py-2.5 rounded-2xl transition ${activeAdminTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="settings">
          <i data-lucide="settings" class="w-4 h-4 inline ml-1"></i>
          <span>إعدادات النظام</span>
        </button>
      </div>

      <!-- Tab 1: Overview -->
      ${activeAdminTab === 'overview' ? `
        <div class="space-y-6">
          
          <!-- KPI Stat Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-gray-400 block mb-1">إجمالي الحسابات</span>
              <span class="text-2xl font-black text-gray-900 dark:text-white font-heading">${stats.total_users}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-emerald-600 block mb-1">الحسابات النشطة</span>
              <span class="text-2xl font-black text-emerald-600 font-heading">${stats.active_users}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-rose-600 block mb-1">الحسابات المعلقة</span>
              <span class="text-2xl font-black text-rose-600 font-heading">${stats.suspended_users}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-gray-500 block mb-1">مستخدمو Free</span>
              <span class="text-2xl font-black text-gray-700 dark:text-gray-300 font-heading">${stats.free_users}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-amber-600 block mb-1">مستخدمو PRO</span>
              <span class="text-2xl font-black text-amber-600 font-heading">${stats.pro_users}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-indigo-600 block mb-1">إجمالي المهام</span>
              <span class="text-2xl font-black text-indigo-600 font-heading">${stats.total_tasks}</span>
            </div>
            <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
              <span class="text-xs text-teal-600 block mb-1">طلبات AI الكلية</span>
              <span class="text-2xl font-black text-teal-600 font-heading">${stats.total_ai_usage}</span>
            </div>
          </div>

          <!-- Recent Users Table -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">
              أحدث المسجلين في المنصة
            </h3>

            <div class="overflow-x-auto">
              <table class="w-full text-right text-xs">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th class="pb-3 font-semibold">المستخدم</th>
                    <th class="pb-3 font-semibold">البريد</th>
                    <th class="pb-3 font-semibold">المرحلة</th>
                    <th class="pb-3 font-semibold">الباقة</th>
                    <th class="pb-3 font-semibold">الحالة</th>
                    <th class="pb-3 font-semibold">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  ${recentUsers.map(u => `
                    <tr class="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                      <td class="py-3 font-bold text-gray-800 dark:text-gray-100">${u.name || 'بدون اسم'}</td>
                      <td class="py-3 text-gray-500 font-mono" dir="ltr">${u.email}</td>
                      <td class="py-3 text-gray-400">${u.school_level || 'المتوسطة'}</td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.plan_id === 'pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'}">
                          ${u.plan_id.toUpperCase()}
                        </span>
                      </td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                          ${u.account_status === 'active' ? 'نشط' : 'معلّق'}
                        </span>
                      </td>
                      <td class="py-3 text-gray-400">${u.created_at.split('T')[0]}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ` : ''}

      <!-- Tab 2: Users Management -->
      ${activeAdminTab === 'users' ? `
        <div class="space-y-4" id="admin-users-view">
          <!-- Users table will be populated by renderAdminUsers -->
        </div>
      ` : ''}

      <!-- Tab 3: Plans Management -->
      ${activeAdminTab === 'plans' ? `
        <div class="space-y-4" id="admin-plans-view">
          <!-- Plans table will be populated by renderAdminPlans -->
        </div>
      ` : ''}

      <!-- Tab 4: System Settings -->
      ${activeAdminTab === 'settings' ? `
        <div class="space-y-4" id="admin-settings-view">
          <!-- System settings will be populated by renderAdminSettings -->
        </div>
      ` : ''}

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Navigation handlers
  container.querySelector('#btn-return-app')?.addEventListener('click', () => onNavigate('dashboard'));

  container.querySelectorAll('.admin-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      activeAdminTab = tabBtn.dataset.tab;
      renderAdmin(container, onNavigate);
    });
  });

  if (activeAdminTab === 'users') {
    renderAdminUsers(container.querySelector('#admin-users-view'), onNavigate);
  } else if (activeAdminTab === 'plans') {
    renderAdminPlans(container.querySelector('#admin-plans-view'));
  } else if (activeAdminTab === 'settings') {
    renderAdminSettings(container.querySelector('#admin-settings-view'));
  }
}

// Sub-view: Users Management
async function renderAdminUsers(container, onNavigate) {
  if (!container) return;
  container.innerHTML = `<div class="p-6 text-center text-gray-400">جاري تحميل قائمة المستخدمين...</div>`;

  try {
    const res = await api.adminGetUsers({ q: searchQuery, status: statusFilter, plan: planFilter });
    cachedUsers = res.users;
  } catch (err) {
    container.innerHTML = `<div class="p-4 text-rose-500">خطأ في التحميل: ${err.message}</div>`;
    return;
  }

  container.innerHTML = `
    <!-- Search & Filters -->
    <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div class="relative flex-1 w-full">
        <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5"></i>
        <input type="text" id="admin-user-search" value="${searchQuery}" placeholder="ابحث باسم الطالب أو البريد الإلكتروني..." class="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <select id="admin-status-filter" class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs">
          <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>كل الحالات</option>
          <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>نشط فقط</option>
          <option value="suspended" ${statusFilter === 'suspended' ? 'selected' : ''}>معلّق فقط</option>
        </select>

        <select id="admin-plan-filter" class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs">
          <option value="all" ${planFilter === 'all' ? 'selected' : ''}>كل الباقات</option>
          <option value="free" ${planFilter === 'free' ? 'selected' : ''}>Free</option>
          <option value="pro" ${planFilter === 'pro' ? 'selected' : ''}>PRO</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800 text-gray-400">
              <th class="pb-3 font-semibold">المستخدم</th>
              <th class="pb-3 font-semibold">البريد</th>
              <th class="pb-3 font-semibold">المهام</th>
              <th class="pb-3 font-semibold">استهلاك الـ AI</th>
              <th class="pb-3 font-semibold">الباقة</th>
              <th class="pb-3 font-semibold">الحالة</th>
              <th class="pb-3 font-semibold text-center">إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            ${cachedUsers.map(u => `
              <tr class="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                <td class="py-3">
                  <span class="font-bold text-gray-800 dark:text-gray-100 block">${u.name || 'بدون اسم'}</span>
                  <span class="text-[10px] text-gray-400">${u.school_level || 'المتوسطة'}</span>
                </td>
                <td class="py-3 text-gray-500 font-mono" dir="ltr">${u.email}</td>
                <td class="py-3 text-gray-600 dark:text-gray-300 font-bold">${u.task_count || 0} مهام</td>
                <td class="py-3 text-teal-600 font-bold">${u.ai_used || 0} طلب</td>
                <td class="py-3">
                  <select class="user-plan-select px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-[11px]" data-uid="${u.id}">
                    <option value="free" ${u.plan_id === 'free' ? 'selected' : ''}>مجانية (FREE)</option>
                    <option value="pro" ${u.plan_id === 'pro' ? 'selected' : ''}>متفوقين (PRO)</option>
                  </select>
                </td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                    ${u.account_status === 'active' ? 'نشط' : 'معلّق'}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    ${u.account_status === 'active' ? `
                    <button class="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 btn-suspend-user" data-uid="${u.id}" data-name="${u.name}">
                      تعليق الحساب
                    </button>
                  ` : `
                    <button class="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-100 btn-activate-user" data-uid="${u.id}">
                      تفعيل الحساب
                    </button>
                  `}
                    <button class="px-2 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 rounded-lg text-[10px] font-bold hover:bg-sky-100 btn-warn-user" data-uid="${u.id}" data-name="${u.name}" title="إرسال تحذير للطالب">
                      تحذير
                    </button>
                    <button class="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] btn-reset-user" data-uid="${u.id}" data-name="${u.name}" title="تصفير بيانات الطالب">
                      تصفير
                    </button>
                    <button class="p-1 text-gray-400 hover:text-rose-600 rounded-lg btn-delete-user" data-uid="${u.id}" data-name="${u.name}" title="حذف الحساب نهائياً">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Search input
  container.querySelector('#admin-user-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderAdminUsers(container, onNavigate);
  });

  // Filters
  container.querySelector('#admin-status-filter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    renderAdminUsers(container, onNavigate);
  });

  container.querySelector('#admin-plan-filter')?.addEventListener('change', (e) => {
    planFilter = e.target.value;
    renderAdminUsers(container, onNavigate);
  });

  // Change Plan
  container.querySelectorAll('.user-plan-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const uid = e.target.dataset.uid;
      const newPlan = e.target.value;
      try {
        await api.adminUpdateUserPlan(uid, newPlan);
        alert('تم تعديل باقة المستخدم بنجاح!');
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Suspend User
  container.querySelectorAll('.btn-suspend-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      const name = btn.dataset.name;
      if (confirm(`هل أنت متأكد من تعليق حساب الطالب "${name}"؟ سيتم منعه من استخدام التطبيق.`)) {
        try {
          await api.adminUpdateUserStatus(uid, 'suspended');
          renderAdminUsers(container, onNavigate);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Activate User
  container.querySelectorAll('.btn-activate-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      try {
        await api.adminUpdateUserStatus(uid, 'active');
        renderAdminUsers(container, onNavigate);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Send Warning
  container.querySelectorAll('.btn-warn-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      const name = btn.dataset.name;
      const message = prompt(`اكتب رسالة التحذير للطالب "${name}":\nستظهر للطالب في منتصف الشاشة لمدة 15 ثانية.`);
      if (message === null || !message.trim()) return;
      try {
        await api.adminSendWarning(uid, message.trim());
        alert('تم إرسال التحذير بنجاح!');
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Reset Data
  container.querySelectorAll('.btn-reset-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      const name = btn.dataset.name;
      if (confirm(`هل أنت متأكد من رغبتك في تصفير وحذف جميع المهام والمواد والامتحانات المسجلة بحساب "${name}"؟`)) {
        try {
          await api.adminResetUserData(uid);
          alert('تم تصفير بيانات الطالب بنجاح.');
          renderAdminUsers(container, onNavigate);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Delete User
  container.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      const name = btn.dataset.name;
      if (confirm(`هل أنت متأكد من حذف حساب الطالب "${name}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        try {
          await api.adminDeleteUser(uid);
          renderAdminUsers(container, onNavigate);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });
}

// Sub-view: Plans Management
async function renderAdminPlans(container) {
  if (!container) return;
  const res = await api.adminGetPlans();
  const plans = res.plans;

  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">
        إدارة الباقات وحدود الذكاء الاصطناعي (AI Limits)
      </h3>
      <p class="text-xs text-gray-400">
        يمكن للمدير تعديل سقف استهلاك الـ AI لكل باقة، ويتم فرضه مباشرة من الخادم على المستخدمين.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        ${plans.map(p => `
          <div class="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/40 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-sm text-gray-900 dark:text-white">${p.name_ar} (${p.id.toUpperCase()})</h4>
              <span class="text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                ${p.is_active ? 'مفعلة' : 'معطلة'}
              </span>
            </div>

            <form class="plan-edit-form space-y-2.5 text-xs" data-pid="${p.id}">
              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">الحد الشهري لطلبات الذكاء الاصطناعي</label>
                <input type="number" class="plan-ai-limit w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-xs" value="${p.ai_limit_per_period}">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">الحد الأقصى للمواد الدراسية</label>
                <input type="number" class="plan-max-sub w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-xs" value="${p.max_subjects}">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">وصف الباقة</label>
                <input type="text" class="plan-desc w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-xs" value="${p.description || ''}">
              </div>

              <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition">
                حفظ تعديلات الباقة
              </button>
            </form>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.plan-edit-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pid = form.dataset.pid;
      const aiLimit = form.querySelector('.plan-ai-limit').value;
      const maxSub = form.querySelector('.plan-max-sub').value;
      const desc = form.querySelector('.plan-desc').value;

      try {
        await api.adminUpdatePlan(pid, {
          ai_limit_per_period: aiLimit,
          max_subjects: maxSub,
          description: desc
        });
        alert('تم تحديث إعدادات الباقة بنجاح!');
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

// Sub-view: System Settings
async function renderAdminSettings(container) {
  if (!container) return;
  const res = await api.adminGetSettings();
  const settings = res.settings;

  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">
        إعدادات النظام العامة ومفاتيح الذكاء الاصطناعي
      </h3>

      <form id="admin-settings-form" class="space-y-4 max-w-lg text-xs">
        <div>
          <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">اسم التطبيق</label>
          <input type="text" id="set-app-name" value="${settings.app_name || 'مُنجزي'}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs">
        </div>

        <div>
          <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">السماح بتسجيل حسابات جديدة للطلاب</label>
          <select id="set-allow-reg" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs">
            <option value="true" ${settings.allow_registration === 'true' ? 'selected' : ''}>مسموح للجميع</option>
            <option value="false" ${settings.allow_registration === 'false' ? 'selected' : ''}>مغلق مؤقتاً</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">
            مفتاح Google Gemini API للخادم (آمن ومشفر في قاعدة بيانات SQLite)
          </label>
          <input type="password" id="set-gemini-key" placeholder="${settings.gemini_api_key_masked || 'أدخل المفتاح السحابي هنا...'}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs">
          <span class="text-[10px] text-gray-400 mt-1 block">لن يتم إرسال هذا المفتاح أو كشفه في كود الجافاسكريبت للعملاء نهائياً.</span>
        </div>

        <button type="submit" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition">
          حفظ إعدادات النظام
        </button>
      </form>
    </div>
  `;

  container.querySelector('#admin-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const appName = container.querySelector('#set-app-name').value;
    const allowReg = container.querySelector('#set-allow-reg').value;
    const geminiKey = container.querySelector('#set-gemini-key').value.trim();

    const payload = {
      app_name: appName,
      allow_registration: allowReg
    };
    if (geminiKey) payload.gemini_api_key = geminiKey;

    try {
      await api.adminUpdateSettings(payload);
      alert('تم حفظ إعدادات النظام بنجاح!');
    } catch (err) {
      alert(err.message);
    }
  });
}
