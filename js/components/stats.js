// Statistics & Progress Component for Munjizi
// 100% Dynamic calculation from authenticated user data
import { store } from '../store.js';

export function renderStats(container, onNavigate) {
  const tasks = store.getTasks();
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = store.getOverdueTasks();
  const exams = store.getExams();
  const subjects = store.getSubjects();
  const sessions = store.state.studySessions || [];

  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Calculate task distribution per subject
  const subjectStats = subjects.map(sub => {
    const subTasks = tasks.filter(t => t.subjectId === sub.id);
    const subCompleted = subTasks.filter(t => t.completed).length;
    return {
      id: sub.id,
      name: sub.name,
      total: subTasks.length,
      completed: subCompleted,
      badgeColor: sub.badgeColor || 'bg-indigo-500'
    };
  }).filter(s => s.total > 0);

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
            إحصائيات الإنتاجية والتقدم الدراسي
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            مؤشرات دقيقة ومباشرة محسوبة من مهامك وساعات مذاكرتك الفعلية.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-export-backup" class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>تصدير نسخة بياناتي (JSON)</span>
          </button>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${completedTasks.length}</span>
          <span class="text-xs text-gray-400 block mt-0.5">مهام منجزة</span>
        </div>

        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${pendingTasks.length}</span>
          <span class="text-xs text-gray-400 block mt-0.5">مهام متبقية</span>
        </div>

        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${overdueTasks.length}</span>
          <span class="text-xs text-gray-400 block mt-0.5">مهام متأخرة</span>
        </div>

        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <i data-lucide="award" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${completionRate}%</span>
          <span class="text-xs text-gray-400 block mt-0.5">نسبة الإنجاز</span>
        </div>

        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
            <i data-lucide="timer" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${totalStudyHours} س</span>
          <span class="text-xs text-gray-400 block mt-0.5">ساعات المذاكرة</span>
        </div>

        <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <div class="w-9 h-9 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2">
            <i data-lucide="calendar" class="w-5 h-5"></i>
          </div>
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">${exams.length}</span>
          <span class="text-xs text-gray-400 block mt-0.5">امتحانات مسجلة</span>
        </div>
      </div>

      <!-- Charts & Visual Indicators -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Tasks Breakdown per Subject -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
            توزيع المهام ونسبة الإنجاز حسب المواد
          </h3>

          ${subjectStats.length === 0 ? `
            <div class="text-center py-10 text-gray-400 text-xs">
              لا توجد مهام مسجلة بالمواد الدراسية بعد. أضف مهامك لتظهر لك الرسوم البيانية.
            </div>
          ` : `
            <div class="space-y-3 pt-2">
              ${subjectStats.map(s => {
                const pct = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100);
                return `
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-gray-800 dark:text-gray-200">${s.name}</span>
                      <span class="text-gray-500 dark:text-gray-400">${s.completed} من ${s.total} منجزة (${pct}%)</span>
                    </div>
                    <div class="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full ${s.badgeColor} rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Weekly Donut Progress -->
        <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between text-center">
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading mb-4">
              مستوى الالتزام العام
            </h3>

            <div class="relative w-36 h-36 mx-auto flex items-center justify-center my-3">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  class="text-gray-100 dark:text-slate-800"
                  stroke-width="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="text-emerald-500 transition-all duration-1000 ease-out"
                  stroke-dasharray="${completionRate}, 100"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute flex flex-col items-center justify-center">
                <span class="text-3xl font-extrabold text-gray-900 dark:text-white font-heading">${completionRate}%</span>
                <span class="text-[10px] text-gray-400">إنجاز كلي</span>
              </div>
            </div>

            <p class="text-xs text-gray-600 dark:text-gray-300 px-2 mt-2 leading-relaxed">
              ${totalTasks === 0 ? 'ابدأ بإضافة أول مهمة دراسية لمتابعة مؤشر تقدمك اليومي والأسبوعي.' :
                completionRate >= 70 ? '🌟 رائع جداً! أنت تتفوق في إدارة وقتك وتنجز معظم التزاماتك المدرسية بامتياز.' :
                completionRate >= 40 ? '👍 بداية جيدة ومستمرة. ركز على مهام اليوم لتزيد من نسبة إنجازك.' :
                '💪 لديك مهام بانتظارك! ابدأ بمهمة واحدة بسيطة الآن وستشعر بالحماس.'}
            </p>
          </div>
        </div>

      </div>

      <!-- Study Sessions Log -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
            سجل جلسات المذاكرة (Pomodoro Sessions)
          </h3>
          <span class="text-xs text-gray-400">إجمالي ${sessions.length} جلسات</span>
        </div>

        ${sessions.length === 0 ? `
          <p class="text-xs text-gray-400 text-center py-6">لا توجد جلسات مذاكرة حتى الآن. توجه لأي مادة وابدأ مؤقت التركيز!</p>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${sessions.map(s => {
              const sub = store.getSubjectById(s.subjectId);
              return `
                <div class="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold text-gray-800 dark:text-gray-200 block">${sub.name}</span>
                    <span class="text-[11px] text-gray-400">${s.topic || 'جلسة مذاكرة'}</span>
                  </div>
                  <div class="text-left">
                    <span class="text-xs font-extrabold text-teal-600 dark:text-teal-400 block font-mono">${s.durationMinutes} د</span>
                    <span class="text-[10px] text-gray-400">${s.date}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Optional Developer / Tester Demo Seed Action -->
      <div class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span class="font-bold text-gray-700 dark:text-gray-300 block">وضع المعاينة والتجربة السريعة (اختياري للمطورين والمراجعين)</span>
          <span class="text-gray-400 text-[11px]">يمكنك شحن نموذج دراسي كامل مؤقتاً بالمواد والمهام لتجربة التطبيق سريعاً.</span>
        </div>
        <button id="btn-load-demo-seed" class="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold hover:bg-emerald-100 transition shrink-0">
          تحميل النموذج التجريبي (Demo Mode)
        </button>
      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Export JSON backup
  container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
    const dataStr = JSON.stringify({
      user: store.state.user,
      tasks: store.state.tasks,
      subjects: store.state.subjects,
      exams: store.state.exams,
      timetable: store.state.timetable,
      notes: store.state.notes,
      studySessions: store.state.studySessions
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munjizi_my_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Load Demo Seed Data
  container.querySelector('#btn-load-demo-seed')?.addEventListener('click', () => {
    store.loadDemoSeedData();
    alert('تم تحميل النموذج التجريبي بنجاح! يمكنك تصفح كافة الأقسام الآن.');
    renderStats(container, onNavigate);
  });
}
