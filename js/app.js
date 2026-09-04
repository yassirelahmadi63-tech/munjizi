// Main Application Entry & Router for Munjizi (Multi-User Architecture)
import { store } from './store.js';
import { api } from './api.js';
import { renderAuthModal } from './components/auth-modal.js';
import { renderNotificationCenter } from './components/notifications.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTasks } from './components/tasks.js';
import { renderSubjects, openAddSubjectModal } from './components/subjects.js';
import { renderExams, openAddExamModal } from './components/exams.js';
import { renderAssistant } from './components/assistant.js';
import { renderStats } from './components/stats.js';
import { renderProfile } from './components/profile.js';
import { renderPlans } from './components/plans.js';
import { renderAdmin } from './components/admin.js';

let currentTab = 'dashboard';
let currentTabOptions = {};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initGlobalNavigation();
  initHeaderInteractions();
  initQuickTaskModal();

  // Check URL hash for direct routing (e.g. #admin, #plans, #profile)
  const hash = window.location.hash.replace('#', '') || (window.location.pathname.includes('/admin') ? 'admin' : 'dashboard');
  if (['dashboard', 'tasks', 'subjects', 'exams', 'assistant', 'stats', 'profile', 'plans', 'admin'].includes(hash)) {
    currentTab = hash;
  }

  // Verify Session with Backend SQLite
  const isAuth = await store.checkSession();
  const authModalContainer = document.getElementById('auth-modal');

  if (!isAuth || store.state.isSuspended) {
    renderAuthModal(authModalContainer, () => {
      onUserAuthenticated();
    });
  } else {
    onUserAuthenticated();
  }

  // Subscribe to reactive store changes
  store.subscribe((state) => {
    updateHeaderProfile(state.user);
    updateNotificationBadge();
    if (!state.isAuthenticated || state.isSuspended) {
      renderAuthModal(authModalContainer, () => onUserAuthenticated());
    }
  });
});

function onUserAuthenticated() {
  const user = store.state.user;
  updateHeaderProfile(user);
  updateAdminLinksVisibility(user);

  // If user requested admin but is not admin, redirect to dashboard
  if (currentTab === 'admin' && user.role !== 'admin') {
    currentTab = 'dashboard';
  }

  navigateTo(currentTab);
  startWarningPolling();
}

// Admin Warning Popup: polls for pending warnings and shows a centered banner for 15s
let warningShowing = false;
function startWarningPolling() {
  if (store.state.user?.role === 'admin') return;
  window.clearInterval(window.__warningPollTimer);
  window.__warningPollTimer = setInterval(async () => {
    if (warningShowing || !store.state.isAuthenticated || !store.state.user) return;
    try {
      const res = await api.checkWarning();
      if (res.warning) {
        warningShowing = true;
        showWarningBanner(res.warning.message, res.warning.id);
      }
    } catch (e) { /* ignore polling errors */ }
  }, 4000);
}

function showWarningBanner(message, warningId) {
  // Mark as read on the server so it won't re-poll
  if (warningId) {
    api.dismissWarning(warningId).catch(() => {});
  }
  let overlay = document.getElementById('warning-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'warning-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);padding:1rem;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:#fff;border:3px solid #f59e0b;border-radius:24px;max-width:480px;width:100%;padding:2rem;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.35);position:relative;animation:pop .3s ease;">
      <div style="width:64px;height:64px;border-radius:20px;background:#fef3c7;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
        <i data-lucide="alert-triangle" style="width:34px;height:34px;color:#d97706;"></i>
      </div>
      <h3 style="font-size:1.25rem;font-weight:800;color:#92400e;margin-bottom:.75rem;font-family:inherit;">تنبيه من الإدارة</h3>
      <p style="font-size:1.05rem;line-height:1.8;color:#1f2937;font-weight:600;">${message}</p>
      <p style="font-size:.8rem;color:#9ca3af;margin-top:1rem;">سيتم إغلاق هذه الرسالة تلقائياً</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  overlay.classList.remove('hidden');

  const close = () => {
    overlay.remove();
    overlay = null;
    warningShowing = false;
    const el = document.getElementById('warning-overlay');
    if (el) el.remove();
  };

  // Auto-close after 15 seconds
  setTimeout(close, 15000);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}


// Global Navigation Handler
export function navigateTo(tabName, options = {}) {
  // Guard admin route
  if (tabName === 'admin' && (!store.state.user || store.state.user.role !== 'admin')) {
    alert('عذراً! قسم الإدارة مخصص لمدراء النظام فقط.');
    tabName = 'dashboard';
  }

  currentTab = tabName;
  currentTabOptions = options;
  window.location.hash = tabName;
  updateNavUI(tabName);
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  const mainContainer = document.getElementById('main-content-view');
  if (!mainContainer) return;

  switch (currentTab) {
    case 'dashboard':
      renderDashboard(mainContainer, navigateTo, openQuickAddTaskModal);
      break;
    case 'tasks':
      renderTasks(mainContainer, openQuickAddTaskModal);
      break;
    case 'subjects':
      renderSubjects(mainContainer, navigateTo, openQuickAddTaskModal, currentTabOptions.subjectId);
      break;
    case 'exams':
      renderExams(mainContainer, navigateTo, currentTabOptions.subjectId);
      break;
    case 'assistant':
      renderAssistant(mainContainer, navigateTo, currentTabOptions);
      break;
    case 'stats':
      renderStats(mainContainer, navigateTo);
      break;
    case 'profile':
      renderProfile(mainContainer, navigateTo);
      break;
    case 'plans':
      renderPlans(mainContainer, navigateTo);
      break;
    case 'admin':
      renderAdmin(mainContainer, navigateTo);
      break;
    default:
      renderDashboard(mainContainer, navigateTo, openQuickAddTaskModal);
  }

  updateNotificationBadge();
}

// Update Active Nav Link States
function updateNavUI(activeTab) {
  // Desktop Sidebar Links
  document.querySelectorAll('.nav-link-desktop').forEach(link => {
    const tab = link.dataset.tab;
    if (tab === activeTab) {
      link.className = 'nav-link-desktop flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25 transition';
    } else {
      link.className = 'nav-link-desktop flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium transition';
    }
  });

  // Mobile Bottom Nav Links
  document.querySelectorAll('.nav-link-mobile').forEach(link => {
    const tab = link.dataset.tab;
    if (tab === activeTab) {
      link.className = 'nav-link-mobile flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold transition scale-105';
    } else {
      link.className = 'nav-link-mobile flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 font-medium transition';
    }
  });
}

function updateAdminLinksVisibility(user) {
  const adminLinks = document.querySelectorAll('.admin-only-link');
  adminLinks.forEach(link => {
    if (user && user.role === 'admin') {
      link.classList.remove('hidden');
    } else {
      link.classList.add('hidden');
    }
  });
}

function updateHeaderProfile(user) {
  if (!user) return;
  const nameEl = document.getElementById('header-user-name');
  const avatarEl = document.getElementById('header-user-avatar');
  const gradeEl = document.getElementById('header-user-grade');
  const planEl = document.getElementById('header-plan-badge');

  if (nameEl) nameEl.textContent = user.name || 'طالب متميز';
  if (avatarEl) avatarEl.textContent = user.avatar || '🎓';
  if (gradeEl) gradeEl.textContent = user.school_level || 'المرحلة المتوسطة';
  if (planEl) {
    planEl.textContent = user.plan_id === 'pro' ? '👑 PRO' : 'مجاني';
    planEl.className = user.plan_id === 'pro' 
      ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
      : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300';
  }
}

// Bind Navigation Clicks
function initGlobalNavigation() {
  document.querySelectorAll('.nav-link-desktop').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      navigateTo(tab);
    });
  });

  document.querySelectorAll('.nav-link-mobile').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      navigateTo(tab);
    });
  });
}

// Header Interactions (Notifications, Theme Toggle, Profile)
function initHeaderInteractions() {
  // Theme Toggle Button
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = store.toggleTheme();
      updateThemeIcon(newTheme);
    });
    updateThemeIcon(store.getTheme());
  }

  // Notification Bell Dropdown
  const notifBtn = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifContent = document.getElementById('notif-content-area');

  if (notifBtn && notifDropdown && notifContent) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      if (!notifDropdown.classList.contains('hidden')) {
        renderNotificationCenter(notifContent, navigateTo);
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  // Header Add Task Button
  document.getElementById('btn-header-add-task')?.addEventListener('click', () => {
    openQuickAddTaskModal();
  });

  // Profile click in header
  document.getElementById('btn-header-profile')?.addEventListener('click', () => {
    navigateTo('profile');
  });

  // Admin button in header
  document.getElementById('btn-header-admin')?.addEventListener('click', () => {
    navigateTo('admin');
  });
}

function updateThemeIcon(theme) {
  const iconPlaceholder = document.getElementById('theme-icon-slot');
  if (iconPlaceholder) {
    iconPlaceholder.innerHTML = theme === 'dark' 
      ? '<i data-lucide="sun" class="w-5 h-5 text-amber-400"></i>'
      : '<i data-lucide="moon" class="w-5 h-5 text-slate-700"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function updateNotificationBadge() {
  const notifs = store.getNotifications();
  const badge = document.getElementById('notif-badge');
  const count = document.getElementById('notif-count');
  if (badge) {
    if (notifs.length > 0) {
      badge.classList.remove('hidden');
      if (count) count.textContent = notifs.length;
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Quick Add Task Modal
export function openQuickAddTaskModal(initialData = {}) {
  const subjects = store.getSubjects();
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  const todayStr = store.getTodayDateStr();

  modal.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <i data-lucide="check-square" class="w-4 h-4"></i>
            </span>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
              إضافة مهمة أو واجب مدرسي جديد
            </h3>
          </div>
          <button id="btn-close-quick-modal" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="quick-task-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان المهمة أو الواجب *</label>
            <input type="text" id="quick-title" required placeholder="مثال: حل تدريبات ص 24، مشروع العلوم، قراءة الفصل..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية</label>
              <select id="quick-subject" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">-- بدون مادة محددة --</option>
                ${subjects.map(s => `<option value="${s.id}" ${initialData.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">درجة الأولوية</label>
              <select id="quick-priority" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="high">أولوية قصوى (عاجل)</option>
                <option value="medium" selected>أولوية متوسطة</option>
                <option value="low">أولوية عادية</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تاريخ التسليم *</label>
              <input type="date" id="quick-date" required value="${initialData.dueDate || todayStr}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وقت التسليم</label>
              <input type="time" id="quick-time" value="18:00" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وصف أو تفاصيل المطلوب (اختياري)</label>
            <textarea id="quick-description" rows="2" placeholder="اكتب رقم الصفحات أو الأسئلة المطلوبة..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-quick" class="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              إلغاء
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
              <span>إضافة المهمة</span>
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  modal.classList.remove('hidden');

  const close = () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  };

  modal.querySelector('#btn-close-quick-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel-quick').addEventListener('click', close);

  modal.querySelector('#quick-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await store.addTask({
      title: modal.querySelector('#quick-title').value,
      subjectId: modal.querySelector('#quick-subject').value,
      priority: modal.querySelector('#quick-priority').value,
      dueDate: modal.querySelector('#quick-date').value,
      dueTime: modal.querySelector('#quick-time').value,
      description: modal.querySelector('#quick-description').value
    });
    close();
    renderCurrentView();
  });
}

function initQuickTaskModal() {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openQuickAddTaskModal();
    }
  });
}
