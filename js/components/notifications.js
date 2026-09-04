// Notifications Component for Munjizi
import { store } from '../store.js';

export function renderNotificationCenter(container, onNavigate) {
  const notifications = store.getNotifications();
  const badgeEl = document.getElementById('notif-badge');
  const countEl = document.getElementById('notif-count');
  
  const totalCount = notifications.length;
  if (badgeEl) {
    if (totalCount > 0) {
      badgeEl.classList.remove('hidden');
      if (countEl) countEl.textContent = totalCount;
    } else {
      badgeEl.classList.add('hidden');
    }
  }

  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center px-4">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <i data-lucide="check-circle-2" class="w-6 h-6"></i>
        </div>
        <h4 class="font-bold text-gray-800 dark:text-gray-100 text-sm">أنت في المسار الصحيح!</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">لا توجد تنبيهات عاجلة حالياً. أحسنت عملاً!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        <span class="font-bold text-sm text-gray-800 dark:text-gray-100">التنبيهات المدرسية (${totalCount})</span>
      </div>
      <span class="text-xs text-gray-400">تحديث تلقائي</span>
    </div>
    <div class="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
      ${notifications.map(n => {
        let badgeBg = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        let iconName = 'bell';
        if (n.type === 'danger') {
          badgeBg = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
          iconName = 'alert-triangle';
        } else if (n.type === 'warning') {
          badgeBg = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
          iconName = 'clock';
        }

        return `
          <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition cursor-pointer flex items-start gap-3 notif-item" data-tab="${n.actionTab}">
            <div class="w-8 h-8 rounded-xl ${badgeBg} flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="${iconName}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1">
              <h5 class="text-xs font-bold text-gray-800 dark:text-gray-100">${n.title}</h5>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">${n.message}</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="p-2 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/50">
      <button id="btn-view-all-tasks" class="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
        الانتقال إلى قائمة المهام والامتحانات ←
      </button>
    </div>
  `;

  // Bind clicks
  container.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (onNavigate) onNavigate(tab);
      const dropdown = document.getElementById('notif-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
    });
  });

  const viewAllBtn = container.querySelector('#btn-view-all-tasks');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      if (onNavigate) onNavigate('tasks');
      const dropdown = document.getElementById('notif-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
    });
  }

  if (window.lucide) window.lucide.createIcons();
}
