// Subjects Component for Munjizi
import { store } from '../store.js';

let activeSubjectId = null;
let activeSubjectTab = 'tasks'; // 'tasks', 'notes', 'exams', 'timer'
let pomodoroTimerInterval = null;
let pomodoroSecondsLeft = 25 * 60;
let pomodoroIsRunning = false;

export function renderSubjects(container, onNavigate, onOpenAddTask, initialSubjectId = null) {
  if (initialSubjectId) {
    activeSubjectId = initialSubjectId;
  }

  if (activeSubjectId) {
    renderSubjectDetail(container, onNavigate, onOpenAddTask, activeSubjectId);
  } else {
    renderSubjectsList(container, onNavigate, onOpenAddTask);
  }
}

// 1. Grid List of All Subjects
function renderSubjectsList(container, onNavigate, onOpenAddTask) {
  const subjects = store.getSubjects();

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
            المواد الدراسية المقررة
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            اختر مادة دراسية للاطلاع على مهامها، ملاحظاتها، امتحاناتها، وبدء جلسة مذاكرة موقوتة.
          </p>
        </div>
        <button id="btn-add-subject-modal" class="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition text-sm flex items-center justify-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>إضافة مادة مخصصة</span>
        </button>
      </div>

      <!-- Subjects Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${subjects.map(sub => {
          const tasks = store.getTasks().filter(t => t.subjectId === sub.id);
          const activeTasks = tasks.filter(t => !t.completed);
          const exams = store.getExams().filter(e => e.subjectId === sub.id && e.isUpcoming);
          const notes = store.getNotesBySubject(sub.id);

          return `
            <div class="p-5 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm hover-lift transition cursor-pointer subject-card flex flex-col justify-between" data-id="${sub.id}">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="w-11 h-11 rounded-2xl ${sub.badgeColor} text-white flex items-center justify-center shadow-md">
                    <i data-lucide="${sub.icon || 'book-open'}" class="w-5 h-5"></i>
                  </div>
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full ${sub.bgLight}">
                    ${sub.code || 'SUB'}
                  </span>
                </div>

                <h3 class="text-lg font-bold text-gray-900 dark:text-white font-heading">
                  ${sub.name}
                </h3>
                
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${sub.teacher ? `المعلم: ${sub.teacher}` : 'مادة مقررة'}
                </p>

                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">
                  ${sub.description || ''}
                </p>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div class="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-800">
                  <span class="font-extrabold text-gray-800 dark:text-gray-100">${activeTasks.length}</span>
                  <span class="text-[10px] text-gray-400 block">مهام نشطة</span>
                </div>
                <div class="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-800">
                  <span class="font-extrabold text-amber-600 dark:text-amber-400">${exams.length}</span>
                  <span class="text-[10px] text-gray-400 block">امتحانات</span>
                </div>
                <div class="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-800">
                  <span class="font-extrabold text-emerald-600 dark:text-emerald-400">${notes.length}</span>
                  <span class="text-[10px] text-gray-400 block">ملاحظات</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind click on subject cards
  container.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
      activeSubjectId = card.dataset.id;
      renderSubjectDetail(container, onNavigate, onOpenAddTask, activeSubjectId);
    });
  });

  // Add custom subject button
  container.querySelector('#btn-add-subject-modal')?.addEventListener('click', () => {
    openAddSubjectModal(() => renderSubjectsList(container, onNavigate, onOpenAddTask));
  });
}

// 2. Dedicated Subject Detail View
function renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId) {
  const subject = store.getSubjectById(subjectId);
  const tasks = store.getTasks().filter(t => t.subjectId === subjectId);
  const activeTasks = tasks.filter(t => !t.completed);
  const notes = store.getNotesBySubject(subjectId);
  const exams = store.getExams().filter(e => e.subjectId === subjectId);
  const sessions = store.state.studySessions.filter(s => s.subjectId === subjectId);
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Back button & Subject Title Header -->
      <div class="flex items-center justify-between gap-4">
        <button id="btn-back-to-subjects" class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5">
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
          <span>العودة لجميع المواد</span>
        </button>
        
        <div class="flex items-center gap-2">
          <button id="btn-ai-subject-assist" class="py-2 px-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5">
            <i data-lucide="bot" class="w-3.5 h-3.5"></i>
            <span>مراجعة ذكية بالـ AI</span>
          </button>
          <button id="btn-delete-subject" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition" title="حذف المادة">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Hero Card for this Subject -->
      <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-start sm:items-center gap-4">
          <div class="w-16 h-16 rounded-3xl ${subject.badgeColor} text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <i data-lucide="${subject.icon || 'book-open'}" class="w-8 h-8"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${subject.bgLight}">
                ${subject.code || 'SUB'}
              </span>
              <span class="text-xs text-gray-400">
                ${subject.teacher || 'معلم المادة'}
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
              ${subject.name}
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
              ${subject.description || 'مقرر دراسي'}
            </p>
          </div>
        </div>

        <!-- Quick Counters -->
        <div class="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-2xl shrink-0">
          <div class="text-center px-2">
            <span class="text-lg font-extrabold text-gray-800 dark:text-gray-100 block">${activeTasks.length}</span>
            <span class="text-[10px] text-gray-400">مهام نشطة</span>
          </div>
          <div class="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>
          <div class="text-center px-2">
            <span class="text-lg font-extrabold text-amber-600 dark:text-amber-400 block">${exams.length}</span>
            <span class="text-[10px] text-gray-400">امتحانات</span>
          </div>
          <div class="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>
          <div class="text-center px-2">
            <span class="text-lg font-extrabold text-teal-600 dark:text-teal-400 block">${totalStudyMinutes}د</span>
            <span class="text-[10px] text-gray-400">مذاكرة</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs inside Subject -->
      <div class="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-bold">
        <button class="sub-tab px-4 py-2 rounded-xl transition ${activeSubjectTab === 'tasks' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="tasks">
          المهام والتكليفات (${tasks.length})
        </button>
        <button class="sub-tab px-4 py-2 rounded-xl transition ${activeSubjectTab === 'notes' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="notes">
          الملاحظات والملخصات (${notes.length})
        </button>
        <button class="sub-tab px-4 py-2 rounded-xl transition ${activeSubjectTab === 'exams' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="exams">
          الامتحانات (${exams.length})
        </button>
        <button class="sub-tab px-4 py-2 rounded-xl transition ${activeSubjectTab === 'timer' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}" data-tab="timer">
          مؤقت المذاكرة (بومودورو) ⏱️
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="subject-tab-content">
        
        <!-- 1. TASKS TAB -->
        ${activeSubjectTab === 'tasks' ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">مهام مادة ${subject.name}</h3>
              <button id="btn-add-subject-task" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>مهمة جديدة</span>
              </button>
            </div>

            ${tasks.length === 0 ? `
              <div class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p class="text-xs text-gray-400">لا توجد مهام مسجلة لهذه المادة بعد.</p>
              </div>
            ` : `
              <div class="space-y-2.5">
                ${tasks.map(t => `
                  <div class="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" ${t.completed ? 'checked' : ''} class="custom-checkbox sub-task-cb" data-id="${t.id}">
                      <div>
                        <h4 class="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 ${t.completed ? 'line-through text-gray-400' : ''}">
                          ${t.title}
                        </h4>
                        <span class="text-[11px] text-gray-400">موعد التسليم: ${t.dueDate}</span>
                      </div>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${t.priority === 'high' ? 'bg-rose-100 text-rose-700' : t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}">
                      ${t.priority === 'high' ? 'عاجل' : t.priority === 'medium' ? 'متوسط' : 'عادي'}
                    </span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- 2. NOTES & SUMMARIES TAB -->
        ${activeSubjectTab === 'notes' ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">دفتر الملاحظات والملخصات</h3>
              <button id="btn-add-new-note" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>تدوين ملاحظة</span>
              </button>
            </div>

            <!-- Add Note Form Container (Hidden by default) -->
            <div id="new-note-box" class="hidden p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 space-y-3">
              <input type="text" id="note-title-input" placeholder="عنوان الملاحظة أو الدرس..." class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100">
              <textarea id="note-content-input" rows="4" placeholder="اكتب الملاحظات، القواعد الهامة، أو ملخص الحصة..." class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100"></textarea>
              <div class="flex justify-end gap-2">
                <button id="btn-cancel-note" class="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">إلغاء</button>
                <button id="btn-save-note" class="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">حفظ الملاحظة</button>
              </div>
            </div>

            ${notes.length === 0 ? `
              <div class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p class="text-xs text-gray-400">لا توجد ملاحظات مدونة بعد. انقر على "تدوين ملاحظة" لحفظ ملخصاتك.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${notes.map(n => `
                  <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm relative group">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        ${n.title}
                      </h4>
                      <button class="text-gray-400 hover:text-rose-500 p-1 btn-delete-note" data-id="${n.id}" title="حذف الملاحظة">
                        <i data-lucide="trash" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      ${n.content}
                    </p>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- 3. EXAMS TAB -->
        ${activeSubjectTab === 'exams' ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">امتحانات واختبارات ${subject.name}</h3>
              <button id="btn-add-subject-exam" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>إضافة موعد امتحان</span>
              </button>
            </div>

            ${exams.length === 0 ? `
              <div class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p class="text-xs text-gray-400">لا توجد امتحانات مسجلة لهذه المادة حالياً.</p>
              </div>
            ` : `
              <div class="space-y-3">
                ${exams.map(e => `
                  <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-bold text-gray-900 dark:text-white">${e.name}</h4>
                      <div class="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>التاريخ: ${e.date}</span>
                        <span>الوقت: ${e.time}</span>
                        <span>القاعة: ${e.room || 'فصل المدرسة'}</span>
                      </div>
                      ${e.notes ? `<p class="text-xs text-amber-600 dark:text-amber-400 mt-1">ملاحظات: ${e.notes}</p>` : ''}
                    </div>
                    <span class="text-xs font-bold px-3 py-1 rounded-full ${e.daysRemaining <= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}">
                      ${e.daysRemaining === 0 ? 'اليوم' : `باقي ${e.daysRemaining} أيام`}
                    </span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- 4. STUDY TIMER (POMODORO) TAB -->
        ${activeSubjectTab === 'timer' ? `
          <div class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center max-w-lg mx-auto space-y-6">
            <div class="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <i data-lucide="timer" class="w-8 h-8"></i>
            </div>

            <div>
              <h3 class="text-xl font-bold font-heading text-gray-900 dark:text-white">
                جلسة تركيز لمادة ${subject.name}
              </h3>
              <p class="text-xs text-gray-400 mt-1">تقنية بومودورو: 25 دقيقة من التركيز الكامل بدون مقاطعات تليها استراحة قصيرة.</p>
            </div>

            <div class="py-6">
              <div id="timer-display" class="text-6xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-wider">
                ${formatTimer(pomodoroSecondsLeft)}
              </div>
            </div>

            <div class="flex items-center justify-center gap-3">
              <button id="btn-timer-toggle" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 text-sm transition">
                ${pomodoroIsRunning ? 'إيقاف مؤقت' : 'ابدأ المذاكرة الآن'}
              </button>
              <button id="btn-timer-reset" class="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm hover:bg-gray-200 transition">
                إعادة ضبط (25د)
              </button>
            </div>

            <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
              <button id="btn-log-session-manual" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                تسجيل جلسة مذاكرة مكتملة (25 دقيقة) في السجل مباشرة
              </button>
            </div>
          </div>
        ` : ''}

      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Back button
  container.querySelector('#btn-back-to-subjects')?.addEventListener('click', () => {
    activeSubjectId = null;
    renderSubjectsList(container, onNavigate, onOpenAddTask);
  });

  // AI assistant direct button
  container.querySelector('#btn-ai-subject-assist')?.addEventListener('click', () => {
    if (onNavigate) onNavigate('assistant', { subject: subject.name });
  });

  // Delete subject
  container.querySelector('#btn-delete-subject')?.addEventListener('click', () => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف مادة ${subject.name}؟`)) {
      store.deleteSubject(subjectId);
      activeSubjectId = null;
      renderSubjectsList(container, onNavigate, onOpenAddTask);
    }
  });

  // Sub-tabs navigation
  container.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeSubjectTab = tab.dataset.tab;
      renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
    });
  });

  // Checkbox inside tasks tab
  container.querySelectorAll('.sub-task-cb').forEach(cb => {
    cb.addEventListener('change', (e) => {
      store.toggleTaskCompleted(e.target.dataset.id);
      renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
    });
  });

  // Add task button
  container.querySelector('#btn-add-subject-task')?.addEventListener('click', () => {
    if (onOpenAddTask) onOpenAddTask({ subjectId });
  });

  // Add Exam button
  container.querySelector('#btn-add-subject-exam')?.addEventListener('click', () => {
    if (onNavigate) onNavigate('exams', { subjectId });
  });

  // Notes interactions
  const newNoteBox = container.querySelector('#new-note-box');
  container.querySelector('#btn-add-new-note')?.addEventListener('click', () => {
    if (newNoteBox) newNoteBox.classList.toggle('hidden');
  });

  container.querySelector('#btn-cancel-note')?.addEventListener('click', () => {
    if (newNoteBox) newNoteBox.classList.add('hidden');
  });

  container.querySelector('#btn-save-note')?.addEventListener('click', () => {
    const title = container.querySelector('#note-title-input')?.value;
    const content = container.querySelector('#note-content-input')?.value;
    if (title && title.trim()) {
      store.addNote(subjectId, title, content || '');
      renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
    } else {
      alert('يرجى كتابة عنوان للملاحظة');
    }
  });

  container.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteNote(btn.dataset.id);
      renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
    });
  });

  // Pomodoro timer logic
  const timerDisplay = container.querySelector('#timer-display');
  const timerToggleBtn = container.querySelector('#btn-timer-toggle');
  const timerResetBtn = container.querySelector('#btn-timer-reset');
  const logSessionBtn = container.querySelector('#btn-log-session-manual');

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', () => {
      if (pomodoroIsRunning) {
        clearInterval(pomodoroTimerInterval);
        pomodoroIsRunning = false;
        timerToggleBtn.textContent = 'استئناف المذاكرة';
      } else {
        pomodoroIsRunning = true;
        timerToggleBtn.textContent = 'إيقاف مؤقت';
        pomodoroTimerInterval = setInterval(() => {
          pomodoroSecondsLeft--;
          if (timerDisplay) timerDisplay.textContent = formatTimer(pomodoroSecondsLeft);
          if (pomodoroSecondsLeft <= 0) {
            clearInterval(pomodoroTimerInterval);
            pomodoroIsRunning = false;
            pomodoroSecondsLeft = 25 * 60;
            store.logStudySession(subjectId, 25, `مذاكرة مادة ${subject.name}`);
            alert(`🎉 أحسنت عملاً! أنهيت 25 دقيقة من المذاكرة المركزة في ${subject.name}. استرح 5 دقائق الآن!`);
            renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
          }
        }, 1000);
      }
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', () => {
      clearInterval(pomodoroTimerInterval);
      pomodoroIsRunning = false;
      pomodoroSecondsLeft = 25 * 60;
      if (timerDisplay) timerDisplay.textContent = formatTimer(pomodoroSecondsLeft);
      if (timerToggleBtn) timerToggleBtn.textContent = 'ابدأ المذاكرة الآن';
    });
  }

  if (logSessionBtn) {
    logSessionBtn.addEventListener('click', () => {
      store.logStudySession(subjectId, 25, `جلسة مذاكرة ${subject.name}`);
      alert(`تم تسجيل 25 دقيقة مذاكرة لمادة ${subject.name} بنجاح! 👏`);
      renderSubjectDetail(container, onNavigate, onOpenAddTask, subjectId);
    });
  }
}

// Modal for Adding Custom Subject
export function openAddSubjectModal(onSaved) {
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <i data-lucide="book-plus" class="w-4 h-4"></i>
            </span>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
              إضافة مادة دراسية مخصصة
            </h3>
          </div>
          <button id="btn-close-sub-modal" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="add-subject-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">اسم المادة *</label>
            <input type="text" id="sub-name" required placeholder="مثال: التربية الفنية، الحاسب الآلي، الفيزياء" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رمز المادة (3-4 أحرف)</label>
              <input type="text" id="sub-code" placeholder="مثال: ART" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">اسم المعلم</label>
              <input type="text" id="sub-teacher" placeholder="أ. فلان" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">لون المادة المميز</label>
            <select id="sub-color" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="emerald">أخضر زمردي</option>
              <option value="indigo">نيلي كلاسيكي</option>
              <option value="cyan">سماوي نضر</option>
              <option value="amber">كهرماني دافئ</option>
              <option value="rose">وردي حيوي</option>
              <option value="violet">بنفسجي ملكي</option>
              <option value="teal">أخضر مائي</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وصف مختصر</label>
            <textarea id="sub-desc" rows="2" placeholder="ملاحظات حول المنهج أو المقررات..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-sub" class="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              إلغاء
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
              <span>إضافة المادة</span>
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

  modal.querySelector('#btn-close-sub-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel-sub').addEventListener('click', close);

  modal.querySelector('#add-subject-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#sub-name').value;
    const code = modal.querySelector('#sub-code').value;
    const teacher = modal.querySelector('#sub-teacher').value;
    const color = modal.querySelector('#sub-color').value;
    const desc = modal.querySelector('#sub-desc').value;

    store.addSubject({
      name,
      code,
      teacher,
      color,
      description: desc
    });

    close();
    if (onSaved) onSaved();
  });
}
