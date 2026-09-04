// Exams and Weekly Schedule Component for Munjizi
import { store } from '../store.js';

let activeView = 'exams'; // 'exams' or 'timetable'

export function renderExams(container, onNavigate, defaultSubjectId = null) {
  const subjects = store.getSubjects();
  const exams = store.getExams();
  const timetable = store.getTimetable();

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Top Header & View Switcher -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white font-heading">
            الامتحانات والجدول الدراسي الأسبوعي
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            تابع مواعيد اختباراتك، العد التنازلي للمذاكرة، وحصصك المدرسية الأسبوعية.
          </p>
        </div>

        <div class="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0">
          <button id="view-tab-exams" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeView === 'exams' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}">
            مواعيد الاختبارات (${exams.length})
          </button>
          <button id="view-tab-timetable" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeView === 'timetable' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}">
            الجدول الأسبوعي
          </button>
        </div>
      </div>

      <!-- VIEW 1: EXAMS LIST & COUNTDOWN -->
      ${activeView === 'exams' ? `
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <i data-lucide="alarm-clock" class="w-4 h-4 text-amber-500"></i>
              <span>الامتحانات القادمة والعد التنازلي</span>
            </h2>
            <button id="btn-add-exam-modal" class="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>إضافة موعد اختبار</span>
            </button>
          </div>

          ${exams.length === 0 ? `
            <div class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <i data-lucide="calendar-check" class="w-8 h-8"></i>
              </div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-200">لا توجد اختبارات مسجلة</h3>
              <p class="text-xs text-gray-400 mt-1">أضف مواعيد اختباراتك الدورية أو الشهرية لمتابعة العد التنازلي.</p>
              <button id="btn-empty-exam" class="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">
                + إضافة اختبار جديد
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${exams.map(exam => {
                const sub = store.getSubjectById(exam.subjectId);
                const isUrgent = exam.daysRemaining <= 3 && exam.daysRemaining >= 0;
                const daysText = exam.daysRemaining === 0 ? 'اليوم!' : exam.daysRemaining === 1 ? 'غداً' : exam.daysRemaining < 0 ? 'انتهى' : `باقي ${exam.daysRemaining} أيام`;
                const countdownBg = exam.daysRemaining < 0 ? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400' :
                  isUrgent ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';

                return `
                  <div class="p-5 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm hover-lift transition flex flex-col justify-between group">
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-xs font-bold px-2.5 py-1 rounded-md ${sub.bgLight}">
                          ${sub.name}
                        </span>
                        <span class="text-xs font-extrabold px-3 py-1 rounded-full ${countdownBg} shadow-sm">
                          ${daysText}
                        </span>
                      </div>

                      <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">
                        ${exam.name}
                      </h3>

                      <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-2xl mb-3">
                        <div class="flex items-center gap-1.5">
                          <i data-lucide="calendar" class="w-3.5 h-3.5 text-gray-400"></i>
                          <span>${exam.date}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <i data-lucide="clock" class="w-3.5 h-3.5 text-gray-400"></i>
                          <span>${exam.time}</span>
                        </div>
                        <div class="col-span-2 flex items-center gap-1.5">
                          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                          <span>${exam.room || 'فصل المدرسة'}</span>
                        </div>
                      </div>

                      ${exam.notes ? `
                        <div class="text-xs text-gray-600 dark:text-gray-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                          <span class="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">دروس الاختبار:</span>
                          <span>${exam.notes}</span>
                        </div>
                      ` : ''}
                    </div>

                    <div class="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <button class="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 btn-study-plan-exam" data-examname="${exam.name}" data-subject="${sub.name}">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        <span>توليد خطة مراجعة ذكية</span>
                      </button>
                      <button class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition btn-delete-exam" data-id="${exam.id}" title="حذف موعد الاختبار">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      ` : ''}

      <!-- VIEW 2: WEEKLY TIMETABLE -->
      ${activeView === 'timetable' ? `
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <i data-lucide="table" class="w-4 h-4 text-indigo-500"></i>
                <span>الجدول الدراسي الأسبوعي (من الأحد إلى الخميس)</span>
              </h2>
              <p class="text-xs text-gray-400 mt-0.5">جدول الحصص المدرسية لتنظيم اليوم الدراسي وتجهيز الحقيبة.</p>
            </div>
            <button id="btn-add-slot-modal" class="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>إضافة حصة للجدول</span>
            </button>
          </div>

          <!-- 5 Days Timetable Cards -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            ${daysOfWeek.map(day => {
              const daySlots = timetable.filter(t => t.day === day);
              return `
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col">
                  <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
                    <h3 class="font-bold text-sm text-gray-900 dark:text-white font-heading">${day}</h3>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-full">${daySlots.length} حصص</span>
                  </div>

                  <div class="space-y-2.5 flex-1">
                    ${daySlots.length === 0 ? `
                      <p class="text-xs text-gray-400 text-center py-6">لا توجد حصص</p>
                    ` : `
                      ${daySlots.map(slot => {
                        const sub = store.getSubjectById(slot.subjectId);
                        return `
                          <div class="p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition">
                            <span class="text-[10px] text-gray-400 block mb-1 font-mono">${slot.period}</span>
                            <div class="flex items-center gap-1.5 mb-1">
                              <span class="w-2 h-2 rounded-full ${sub.badgeColor}"></span>
                              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">${sub.name}</span>
                            </div>
                            <span class="text-[10px] text-gray-400 block">${slot.room || 'فصل 2/ب'}</span>
                          </div>
                        `;
                      }).join('')}
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Tab switcher
  container.querySelector('#view-tab-exams')?.addEventListener('click', () => {
    activeView = 'exams';
    renderExams(container, onNavigate);
  });

  container.querySelector('#view-tab-timetable')?.addEventListener('click', () => {
    activeView = 'timetable';
    renderExams(container, onNavigate);
  });

  // Add exam modal
  container.querySelector('#btn-add-exam-modal')?.addEventListener('click', () => {
    openAddExamModal(defaultSubjectId, () => renderExams(container, onNavigate));
  });

  container.querySelector('#btn-empty-exam')?.addEventListener('click', () => {
    openAddExamModal(defaultSubjectId, () => renderExams(container, onNavigate));
  });

  // Delete Exam
  container.querySelectorAll('.btn-delete-exam').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('هل أنت متأكد من حذف هذا الاختبار من الجدول؟')) {
        store.deleteExam(id);
        renderExams(container, onNavigate);
      }
    });
  });

  // Study plan generator direct button
  container.querySelectorAll('.btn-study-plan-exam').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = btn.dataset.subject;
      const examName = btn.dataset.examname;
      if (onNavigate) {
        onNavigate('assistant', {
          action: 'plan',
          lessonText: `لدي اختبار قادم في مادة ${subject} بعنوان "${examName}". أرجو إنشاء خطة مراجعة ومذاكرة منظمة ومكثفة للأيام المتبقية.`
        });
      }
    });
  });

  // Add timetable slot
  container.querySelector('#btn-add-slot-modal')?.addEventListener('click', () => {
    openAddSlotModal(() => renderExams(container, onNavigate));
  });
}

// Modal for Adding an Exam
export function openAddExamModal(defaultSubjectId = null, onSaved) {
  const subjects = store.getSubjects();
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  const todayStr = new Date().toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <i data-lucide="calendar-plus" class="w-4 h-4"></i>
            </span>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
              إضافة موعد امتحان جديد
            </h3>
          </div>
          <button id="btn-close-exam-modal" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="add-exam-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">اسم الامتحان أو الاختبار *</label>
            <input type="text" id="exam-name" required placeholder="مثال: اختبار منتصف الفصل، اختبار قصير، الاختبار النهائي" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية *</label>
            <select id="exam-subject" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
              ${subjects.map(s => `<option value="${s.id}" ${defaultSubjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تاريخ الامتحان *</label>
              <input type="date" id="exam-date" required min="${todayStr}" value="${todayStr}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وقت الامتحان</label>
              <input type="time" id="exam-time" value="08:30" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">القاعة أو مكان الامتحان</label>
            <input type="text" id="exam-room" placeholder="مثال: قاعة 10، مختبر العلوم، الفصل" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الدروس المشمولة أو ملاحظات المراجعة</label>
            <textarea id="exam-notes" rows="2" placeholder="اكتب الوحدات والصفحات المطلوبة في الاختبار..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-exam" class="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              إلغاء
            </button>
            <button type="submit" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
              <span>حفظ موعد الاختبار</span>
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

  modal.querySelector('#btn-close-exam-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel-exam').addEventListener('click', close);

  modal.querySelector('#add-exam-form').addEventListener('submit', (e) => {
    e.preventDefault();
    store.addExam({
      name: modal.querySelector('#exam-name').value,
      subjectId: modal.querySelector('#exam-subject').value,
      date: modal.querySelector('#exam-date').value,
      time: modal.querySelector('#exam-time').value,
      room: modal.querySelector('#exam-room').value,
      notes: modal.querySelector('#exam-notes').value
    });
    close();
    if (onSaved) onSaved();
  });
}

// Modal for Adding Timetable Slot
export function openAddSlotModal(onSaved) {
  const subjects = store.getSubjects();
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <i data-lucide="calendar" class="w-4 h-4"></i>
            </span>
            <h3 class="text-base font-bold text-gray-900 dark:text-white font-heading">
              إضافة حصة للجدول الدراسي
            </h3>
          </div>
          <button id="btn-close-slot-modal" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="add-slot-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">اليوم *</label>
            <select id="slot-day" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="الأحد">الأحد</option>
              <option value="الاثنين">الاثنين</option>
              <option value="الثلاثاء">الثلاثاء</option>
              <option value="الأربعاء">الأربعاء</option>
              <option value="الخميس">الخميس</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية *</label>
            <select id="slot-subject" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رقم الحصة والوقت</label>
            <input type="text" id="slot-period" value="الحصة 1 (08:00 - 08:45)" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">مكان الحصة / القاعة</label>
            <input type="text" id="slot-room" value="فصل 2/ب" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-slot" class="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              إلغاء
            </button>
            <button type="submit" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
              <span>إضافة للجدول</span>
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

  modal.querySelector('#btn-close-slot-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel-slot').addEventListener('click', close);

  modal.querySelector('#add-slot-form').addEventListener('submit', (e) => {
    e.preventDefault();
    store.addTimetableSlot({
      day: modal.querySelector('#slot-day').value,
      subjectId: modal.querySelector('#slot-subject').value,
      period: modal.querySelector('#slot-period').value,
      room: modal.querySelector('#slot-room').value
    });
    close();
    if (onSaved) onSaved();
  });
}
