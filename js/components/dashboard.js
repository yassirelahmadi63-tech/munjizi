// Dashboard Component for Munjizi
// 100% Dynamic - Clean Empty States for New Accounts
import { store } from '../store.js';

export function renderDashboard(container, onNavigate, onOpenAddTask) {
  const state = store.state;
  const user = state.user || { name: 'طالب متميز' };
  const tasks = store.getTasks();
  const subjects = store.getSubjects();
  const exams = store.getExams().filter(e => e.isUpcoming);
  const todayTasks = store.getTodayTasks();
  const upcomingTasks = store.getUpcomingTasks();
  const overdueTasks = store.getOverdueTasks();
  const completedTasks = tasks.filter(t => t.completed);
  const progress = store.getWeeklyProgress();
  const sessions = state.studySessions || [];
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const isBrandNewAccount = tasks.length === 0 && subjects.length === 0 && exams.length === 0;

  const todayDateStr = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Greeting & Top Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-950 p-6 rounded-3xl text-white shadow-xl shadow-emerald-700/15 relative overflow-hidden">
        <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute right-1/3 -top-10 w-32 h-32 bg-teal-400/20 rounded-full blur-xl pointer-events-none"></div>
        
        <div class="relative z-10 space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-emerald-100">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            <span>${todayDateStr}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold font-heading">
            مرحبًا يا ${user.name || 'طالب متميز'}! 👋
          </h1>
          <p class="text-emerald-100 text-xs sm:text-sm max-w-xl">
            ${isBrandNewAccount ? 'ابدأ بإضافة أول مهمة مدرسية أو مادة دراسية لتنظيم جدولك الدراسي بسهولة.' : 'تابع إنجاز واجباتك واستعد لاختباراتك القادمة بكل ثقة.'}
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-3">
          <button id="btn-dash-add-task" class="py-3 px-5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold rounded-2xl shadow-lg transition text-xs sm:text-sm flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-600"></i>
            <span>+ إضافة مهمة</span>
          </button>
        </div>
      </div>

      <!-- Weekly Study Progress Indicator -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
              </span>
              <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-heading">
                مؤشر تقدم الدراسة والإنجاز
              </h2>
            </div>
            <p class="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              ${progress.total === 0 ? 'لا توجد مهام مضافة بعد' : `أنجزت ${progress.completed} من ${progress.total} مهام هذا الأسبوع`}
            </p>
          </div>
          <div class="text-left">
            <span class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-heading">${progress.percentage}%</span>
            <span class="text-xs text-gray-400 block">نسبة الإنجاز الفعلية</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-3.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
          <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${progress.percentage}%;"></div>
        </div>

        <!-- 6 Real Dynamic Counters (0 for New Accounts) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 text-center">
          <div class="p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60">
            <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">مهام اليوم</span>
            <span class="text-base sm:text-lg font-extrabold text-gray-800 dark:text-gray-100">${todayTasks.length}</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30">
            <span class="text-xs text-cyan-700 dark:text-cyan-400 block mb-1">المهام القادمة</span>
            <span class="text-base sm:text-lg font-extrabold text-cyan-800 dark:text-cyan-300">${upcomingTasks.length}</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30">
            <span class="text-xs text-rose-700 dark:text-rose-400 block mb-1">المهام المتأخرة</span>
            <span class="text-base sm:text-lg font-extrabold text-rose-800 dark:text-rose-300">${overdueTasks.length}</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30">
            <span class="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">المهام المكتملة</span>
            <span class="text-base sm:text-lg font-extrabold text-emerald-800 dark:text-emerald-300">${completedTasks.length}</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30">
            <span class="text-xs text-amber-700 dark:text-amber-400 block mb-1">الاختبارات القادمة</span>
            <span class="text-base sm:text-lg font-extrabold text-amber-800 dark:text-amber-300">${exams.length}</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30">
            <span class="text-xs text-teal-700 dark:text-teal-400 block mb-1">ساعات المذاكرة</span>
            <span class="text-base sm:text-lg font-extrabold text-teal-800 dark:text-teal-300">${totalStudyHours}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">إجراءات سريعة</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button id="qa-add-task" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500 hover-lift transition text-right group">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <i data-lucide="check-square" class="w-5 h-5"></i>
            </div>
            <div class="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">+ إضافة مهمة</div>
            <div class="text-[11px] text-gray-400 mt-0.5">واجب، تدريب، أو مشروع</div>
          </button>

          <button id="qa-add-subject" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-500 hover-lift transition text-right group">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <i data-lucide="book-plus" class="w-5 h-5"></i>
            </div>
            <div class="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">إضافة مادة</div>
            <div class="text-[11px] text-gray-400 mt-0.5">مقرر دراسي جديد</div>
          </button>

          <button id="qa-add-exam" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-amber-500 hover-lift transition text-right group">
            <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <i data-lucide="calendar-check" class="w-5 h-5"></i>
            </div>
            <div class="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">إضافة اختبار</div>
            <div class="text-[11px] text-gray-400 mt-0.5">موعد وعد تنازلي</div>
          </button>

          <button id="qa-ai-assistant" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-cyan-500 hover-lift transition text-right group">
            <div class="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <i data-lucide="bot" class="w-5 h-5"></i>
            </div>
            <div class="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">المساعد الذكي</div>
            <div class="text-[11px] text-gray-400 mt-0.5">تلخيص، تبسيط، واختبار</div>
          </button>
        </div>
      </div>

      <!-- Empty State Hero (If Account is Brand New) -->
      ${isBrandNewAccount ? `
        <div class="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-gray-800 space-y-4">
          <div class="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            🌱
          </div>
          <h3 class="text-xl font-bold font-heading text-gray-900 dark:text-white">
            مرحباً بك في مُنجزي 👋
          </h3>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            ابدأ بإضافة أول مهمة مدرسية أو مادة دراسية. ستقوم المنصة بتنظيم وقتك ومتابعة تقدمك يوماً بيوم.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button id="btn-empty-add-task-hero" class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition">
              + إضافة أول مهمة
            </button>
            <button id="btn-empty-add-sub-hero" class="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition">
              إضافة أول مادة
            </button>
            <button id="btn-empty-add-exam-hero" class="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition">
              إضافة اختبار
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Main Two-Column Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Right Column: Today's Tasks & Subjects (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Today's Tasks Section -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
                  مهام اليوم
                </h3>
                <span class="text-xs font-semibold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full">
                  ${todayTasks.length}
                </span>
              </div>
              <button id="btn-view-all-tasks-link" class="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                عرض كل المهام ←
              </button>
            </div>

            ${todayTasks.length === 0 ? `
              <div class="text-center py-8 px-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                <p class="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">لا توجد مهام بعد</p>
                <p class="text-xs text-gray-400">أضف أول مهمة مدرسية للبدء.</p>
                <button id="btn-empty-add-task" class="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                  + إضافة مهمة لليوم
                </button>
              </div>
            ` : `
              <div class="space-y-3">
                ${todayTasks.map(t => {
                  const sub = store.getSubjectById(t.subjectId);
                  return `
                    <div class="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-slate-800/50 flex items-start gap-3">
                      <input type="checkbox" ${t.completed ? 'checked' : ''} class="custom-checkbox shrink-0 mt-1 task-checkbox" data-id="${t.id}">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${sub.bgLight || 'bg-gray-100'}">
                            ${sub.name}
                          </span>
                          <span class="text-[11px] text-gray-400 mr-auto">${t.dueTime || '18:00'}</span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 ${t.completed ? 'line-through text-gray-400' : ''}">
                          ${t.title}
                        </h4>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Subjects Overview -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
                المواد الدراسية المقررة
              </h3>
              <button id="btn-view-all-subjects" class="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                استعراض المواد ←
              </button>
            </div>

            ${subjects.length === 0 ? `
              <div class="text-center py-8 rounded-2xl bg-gray-50/50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                <p class="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">لم تضف أي مادة بعد.</p>
                <p class="text-xs text-gray-400">أضف موادك المقررة كـ (الرياضيات، العلوم، لغتي) لبدء تنظيم مهامها.</p>
                <button id="btn-empty-add-sub" class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition">
                  + إضافة مادة جديدة
                </button>
              </div>
            ` : `
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                ${subjects.map(sub => {
                  const subTasks = tasks.filter(t => t.subjectId === sub.id && !t.completed);
                  return `
                    <div class="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/40 hover-lift cursor-pointer transition subject-quick-card" data-subid="${sub.id}">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="w-3 h-3 rounded-full ${sub.badgeColor}"></span>
                        <span class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">${sub.name}</span>
                      </div>
                      <div class="text-[11px] text-gray-500 dark:text-gray-400">
                        ${subTasks.length} مهام نشطة
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

        </div>

        <!-- Left Column: Upcoming Exams & AI Spotlight (1 col) -->
        <div class="space-y-6">
          
          <!-- Upcoming Exams -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <i data-lucide="alarm-clock" class="w-4 h-4"></i>
                </span>
                <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
                  الامتحانات القادمة
                </h3>
              </div>
              <button id="btn-view-exams-link" class="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
                الجدول الكامل ←
              </button>
            </div>

            ${exams.length === 0 ? `
              <div class="text-center py-6 px-3 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500 font-bold">لا توجد اختبارات قادمة.</p>
                <p class="text-[11px] text-gray-400 mt-0.5">أضف مواعيد اختباراتك لمتابعة العد التنازلي.</p>
                <button id="btn-empty-add-exam" class="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold">
                  + إضافة موعد اختبار
                </button>
              </div>
            ` : `
              <div class="space-y-3">
                ${exams.map(exam => {
                  const sub = store.getSubjectById(exam.subjectId);
                  const daysBadge = exam.daysRemaining === 0 ? 'اليوم!' : exam.daysRemaining === 1 ? 'غداً' : `باقي ${exam.daysRemaining} أيام`;
                  return `
                    <div class="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-800/50">
                      <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${sub.bgLight || 'bg-gray-100'}">
                          ${sub.name}
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          ${daysBadge}
                        </span>
                      </div>
                      <h4 class="text-xs font-bold text-gray-900 dark:text-white">${exam.name}</h4>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- AI Study Assistant Card -->
          <div class="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold font-heading">المساعد الدراسي الذكي</h3>
                <p class="text-xs text-indigo-200">رفيقك للمذاكرة الفهم وليس الحفظ</p>
              </div>
            </div>

            <p class="text-xs text-gray-300 leading-relaxed mb-4">
              ألصق أي درس مدرسي للحصول على ملخص فوري، تبسيط للمفاهيم الصعبة، أو اختبار تفاعلي سريع!
            </p>

            <button id="btn-open-assistant-main" class="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2">
              <span>افتح المساعد الدراسي الآن</span>
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
          </div>

        </div>

      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind actions
  container.querySelector('#btn-dash-add-task')?.addEventListener('click', onOpenAddTask);
  container.querySelector('#qa-add-task')?.addEventListener('click', onOpenAddTask);
  container.querySelector('#btn-empty-add-task')?.addEventListener('click', onOpenAddTask);
  container.querySelector('#btn-empty-add-task-hero')?.addEventListener('click', onOpenAddTask);

  container.querySelector('#qa-add-subject')?.addEventListener('click', () => onNavigate('subjects'));
  container.querySelector('#btn-empty-add-sub')?.addEventListener('click', () => onNavigate('subjects'));
  container.querySelector('#btn-empty-add-sub-hero')?.addEventListener('click', () => onNavigate('subjects'));

  container.querySelector('#qa-add-exam')?.addEventListener('click', () => onNavigate('exams'));
  container.querySelector('#btn-empty-add-exam')?.addEventListener('click', () => onNavigate('exams'));
  container.querySelector('#btn-empty-add-exam-hero')?.addEventListener('click', () => onNavigate('exams'));

  container.querySelector('#qa-ai-assistant')?.addEventListener('click', () => onNavigate('assistant'));
  container.querySelector('#btn-open-assistant-main')?.addEventListener('click', () => onNavigate('assistant'));

  container.querySelector('#btn-view-exams-link')?.addEventListener('click', () => onNavigate('exams'));
  container.querySelector('#btn-view-all-tasks-link')?.addEventListener('click', () => onNavigate('tasks'));
  container.querySelector('#btn-view-all-subjects')?.addEventListener('click', () => onNavigate('subjects'));

  // Task Checkboxes
  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      await store.toggleTaskCompleted(e.target.dataset.id);
    });
  });

  // Subject quick navigation
  container.querySelectorAll('.subject-quick-card').forEach(el => {
    el.addEventListener('click', () => {
      onNavigate('subjects', { subjectId: el.dataset.subid });
    });
  });
}
