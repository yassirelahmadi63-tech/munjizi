// Task Management Component for Munjizi
import { store } from '../store.js';

let currentFilter = 'all'; // 'all', 'today', 'upcoming', 'overdue', 'completed'
let currentSubjectFilter = 'all';
let currentPriorityFilter = 'all';
let searchQuery = '';
let currentSort = 'dueDate_asc'; // 'dueDate_asc', 'dueDate_desc', 'priority_desc', 'newest'

export function renderTasks(container, onOpenAddTask, editTaskId = null) {
  const subjects = store.getSubjects();
  let tasks = store.getTasks();
  const today = store.getTodayDateStr();

  // Overdue count
  const overdueCount = store.getOverdueTasks().length;

  // Filter by status/tab
  if (currentFilter === 'today') {
    tasks = tasks.filter(t => t.dueDate === today);
  } else if (currentFilter === 'upcoming') {
    tasks = tasks.filter(t => t.dueDate > today && !t.completed);
  } else if (currentFilter === 'overdue') {
    tasks = tasks.filter(t => t.dueDate < today && !t.completed);
  } else if (currentFilter === 'completed') {
    tasks = tasks.filter(t => t.completed);
  }

  // Filter by subject
  if (currentSubjectFilter !== 'all') {
    tasks = tasks.filter(t => t.subjectId === currentSubjectFilter);
  }

  // Filter by priority
  if (currentPriorityFilter !== 'all') {
    tasks = tasks.filter(t => t.priority === currentPriorityFilter);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    tasks = tasks.filter(t => {
      const sub = store.getSubjectById(t.subjectId);
      return t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        sub.name.toLowerCase().includes(q);
    });
  }

  // Sort
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  if (currentSort === 'dueDate_asc') {
    tasks.sort((a, b) => new Date(a.dueDate + 'T' + (a.dueTime || '00:00')) - new Date(b.dueDate + 'T' + (b.dueTime || '00:00')));
  } else if (currentSort === 'dueDate_desc') {
    tasks.sort((a, b) => new Date(b.dueDate + 'T' + (b.dueTime || '00:00')) - new Date(a.dueDate + 'T' + (a.dueTime || '00:00')));
  } else if (currentSort === 'priority_desc') {
    tasks.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
  } else if (currentSort === 'newest') {
    tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  container.innerHTML = `
    <div class="space-y-5 animate-fade-in pb-12">
      
      <!-- Top Title & Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
            إدارة المهام والواجبات المدرسية
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            تابع واجباتك، مشاريعك، ومواعيد تسليمك الدراسية بدقة وسهولة.
          </p>
        </div>
        <button id="btn-add-new-task" class="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition text-sm flex items-center justify-center gap-2">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      <!-- Overdue Banner (if any) -->
      ${overdueCount > 0 ? `
        <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-rose-200 dark:bg-rose-900 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-xs sm:text-sm font-bold">تنبيه: لديك ${overdueCount} مهمة متأخرة تجاوزت موعدها!</h4>
              <p class="text-[11px] text-rose-600 dark:text-rose-400">بادر بإنجازها الآن لتجنب تراكم الواجبات.</p>
            </div>
          </div>
          <button id="btn-filter-overdue-alert" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition">
            عرض المتأخرات
          </button>
        </div>
      ` : ''}

      <!-- Search & Filters Bar -->
      <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        
        <!-- Search Input -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5"></i>
          <input type="text" id="task-search-input" value="${searchQuery}" placeholder="ابحث باسم المهمة، المادة، أو الوصف..." class="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-slate-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button class="filter-tab px-4 py-2 rounded-xl transition shrink-0 ${currentFilter === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}" data-filter="all">
            الكل (${store.getTasks().length})
          </button>
          <button class="filter-tab px-4 py-2 rounded-xl transition shrink-0 ${currentFilter === 'today' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}" data-filter="today">
            اليوم (${store.getTodayTasks().length})
          </button>
          <button class="filter-tab px-4 py-2 rounded-xl transition shrink-0 ${currentFilter === 'upcoming' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}" data-filter="upcoming">
            القادمة (${store.getUpcomingTasks().length})
          </button>
          <button class="filter-tab px-4 py-2 rounded-xl transition shrink-0 ${currentFilter === 'overdue' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}" data-filter="overdue">
            المتأخرة (${overdueCount})
          </button>
          <button class="filter-tab px-4 py-2 rounded-xl transition shrink-0 ${currentFilter === 'completed' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}" data-filter="completed">
            المكتملة (${store.getTasks().filter(t => t.completed).length})
          </button>
        </div>

        <!-- Dropdown Filters & Sorters -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
          
          <!-- Subject Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">المادة الدراسية</label>
            <select id="filter-subject-select" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">جميع المواد</option>
              ${subjects.map(s => `<option value="${s.id}" ${currentSubjectFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>

          <!-- Priority Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">الأولوية</label>
            <select id="filter-priority-select" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">كل الأولويات</option>
              <option value="high" ${currentPriorityFilter === 'high' ? 'selected' : ''}>أولوية قصوى (عاجل)</option>
              <option value="medium" ${currentPriorityFilter === 'medium' ? 'selected' : ''}>أولوية متوسطة</option>
              <option value="low" ${currentPriorityFilter === 'low' ? 'selected' : ''}>أولوية عادية</option>
            </select>
          </div>

          <!-- Sort Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">الترتيب</label>
            <select id="sort-select" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="dueDate_asc" ${currentSort === 'dueDate_asc' ? 'selected' : ''}>موعد التسليم (الأقرب أولاً)</option>
              <option value="dueDate_desc" ${currentSort === 'dueDate_desc' ? 'selected' : ''}>موعد التسليم (الأبعد أولاً)</option>
              <option value="priority_desc" ${currentSort === 'priority_desc' ? 'selected' : ''}>الأولوية (الأهم أولاً)</option>
              <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>تاريخ الإضافة (الأحدث أولاً)</option>
            </select>
          </div>

        </div>

      </div>

      <!-- Tasks List -->
      <div class="space-y-3">
        ${tasks.length === 0 ? `
          <div class="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center">
              <i data-lucide="inbox" class="w-8 h-8"></i>
            </div>
            <h3 class="text-base font-bold text-gray-800 dark:text-gray-200">لا توجد مهام مطابقة</h3>
            <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">لم نجد أي مهام تطابق المعايير المحددة. جرب تغيير التصفية أو أضف مهمة جديدة الآن.</p>
            <button id="btn-empty-create" class="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition">
              + إضافة مهمة الآن
            </button>
          </div>
        ` : `
          ${tasks.map(t => {
            const sub = store.getSubjectById(t.subjectId);
            const isOverdue = t.dueDate < today && !t.completed;
            const isDueToday = t.dueDate === today;

            const priorityBadge = t.priority === 'high' 
              ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> أولوية قصوى</span>`
              : t.priority === 'medium'
              ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">متوسطة</span>`
              : `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">عادية</span>`;

            const dateBadge = isOverdue
              ? `<span class="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> فات الموعد (${t.dueDate})</span>`
              : isDueToday
              ? `<span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> اليوم (${t.dueTime || '18:00'})</span>`
              : `<span class="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${t.dueDate} (${t.dueTime || '18:00'})</span>`;

            return `
              <div class="p-4 rounded-3xl border ${isOverdue ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900'} shadow-sm hover-lift transition flex items-start gap-3.5 group">
                
                <!-- Checkbox -->
                <div class="pt-0.5 shrink-0">
                  <input type="checkbox" ${t.completed ? 'checked' : ''} class="custom-checkbox task-toggle-cb" data-id="${t.id}" title="تحديد كمكتملة">
                </div>

                <!-- Main Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${sub.bgLight}">
                      ${sub.name}
                    </span>
                    ${priorityBadge}
                    ${dateBadge}
                  </div>

                  <h3 class="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 ${t.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}">
                    ${t.title}
                  </h3>

                  ${t.description ? `
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      ${t.description}
                    </p>
                  ` : ''}

                  ${t.notes ? `
                    <div class="mt-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/80 p-2 rounded-xl flex items-start gap-1.5 border border-gray-100 dark:border-gray-800">
                      <i data-lucide="sticky-note" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"></i>
                      <span>${t.notes}</span>
                    </div>
                  ` : ''}
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                  <button class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition btn-edit-task" data-id="${t.id}" title="تعديل المهمة">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                  </button>
                  <button class="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-gray-400 hover:text-rose-600 transition btn-delete-task" data-id="${t.id}" title="حذف المهمة">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        `}
      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Search input handler
  const searchInput = container.querySelector('#task-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTasks(container, onOpenAddTask);
    });
  }

  // Filter tabs handler
  container.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderTasks(container, onOpenAddTask);
    });
  });

  // Alert overdue button
  container.querySelector('#btn-filter-overdue-alert')?.addEventListener('click', () => {
    currentFilter = 'overdue';
    renderTasks(container, onOpenAddTask);
  });

  // Subject filter
  container.querySelector('#filter-subject-select')?.addEventListener('change', (e) => {
    currentSubjectFilter = e.target.value;
    renderTasks(container, onOpenAddTask);
  });

  // Priority filter
  container.querySelector('#filter-priority-select')?.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderTasks(container, onOpenAddTask);
  });

  // Sort select
  container.querySelector('#sort-select')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks(container, onOpenAddTask);
  });

  // Add Task Buttons
  container.querySelector('#btn-add-new-task')?.addEventListener('click', onOpenAddTask);
  container.querySelector('#btn-empty-create')?.addEventListener('click', onOpenAddTask);

  // Toggle completion
  container.querySelectorAll('.task-toggle-cb').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      store.toggleTaskCompleted(id);
      renderTasks(container, onOpenAddTask);
    });
  });

  // Delete Task
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة؟')) {
        store.deleteTask(id);
        renderTasks(container, onOpenAddTask);
      }
    });
  });

  // Edit Task
  container.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openEditTaskModal(id, () => renderTasks(container, onOpenAddTask));
    });
  });
}

// Modal for Editing Task
export function openEditTaskModal(taskId, onSaved) {
  const task = store.getTaskById(taskId);
  if (!task) return;

  const subjects = store.getSubjects();
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </span>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
              تعديل بيانات المهمة
            </h3>
          </div>
          <button id="btn-close-edit-modal" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="edit-task-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان المهمة *</label>
            <input type="text" id="edit-title" required value="${task.title}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية *</label>
              <select id="edit-subject" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                ${subjects.map(s => `<option value="${s.id}" ${task.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">درجة الأولوية</label>
              <select id="edit-priority" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>أولوية قصوى (عاجل)</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>أولوية متوسطة</option>
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>أولوية عادية</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تاريخ التسليم *</label>
              <input type="date" id="edit-date" required value="${task.dueDate}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وقت التسليم</label>
              <input type="time" id="edit-time" value="${task.dueTime || '18:00'}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الوصف أو تفاصيل المطلوب</label>
            <textarea id="edit-description" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">${task.description || ''}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات إضافية</label>
            <input type="text" id="edit-notes" value="${task.notes || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="مثال: مراجعة الحل مع المعلم">
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-edit" class="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              إلغاء
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
              <span>حفظ التعديلات</span>
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

  modal.querySelector('#btn-close-edit-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel-edit').addEventListener('click', close);

  modal.querySelector('#edit-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    store.updateTask(taskId, {
      title: modal.querySelector('#edit-title').value.trim(),
      subjectId: modal.querySelector('#edit-subject').value,
      priority: modal.querySelector('#edit-priority').value,
      dueDate: modal.querySelector('#edit-date').value,
      dueTime: modal.querySelector('#edit-time').value,
      description: modal.querySelector('#edit-description').value.trim(),
      notes: modal.querySelector('#edit-notes').value.trim()
    });
    close();
    if (onSaved) onSaved();
  });
}
