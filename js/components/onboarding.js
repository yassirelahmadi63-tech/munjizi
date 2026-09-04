// Onboarding Component for Munjizi
import { store } from '../store.js';

export function checkAndShowOnboarding(onComplete) {
  const state = store.state;
  if (state.user && state.user.onboardingComplete) {
    return; // Already completed
  }

  const modalOverlay = document.getElementById('onboarding-modal');
  if (!modalOverlay) return;

  renderOnboardingStep1(modalOverlay, onComplete);
  modalOverlay.classList.remove('hidden');
}

function renderOnboardingStep1(modalOverlay, onComplete) {
  modalOverlay.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-850 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center animate-pop-in relative">
        <div class="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <i data-lucide="sparkles" class="w-10 h-10"></i>
        </div>
        
        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-heading mb-3">
          مرحبًا بك في مُنجزي 👋
        </h2>
        
        <p class="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
          نظّم مهامك، راجع دروسك، واستعد لاختباراتك بسهولة.
        </p>

        <div class="space-y-3 mb-8 text-right bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
            <span>متابعة دقيقة للواجبات والمهام المدرسية اليومية والأسبوعية.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
            <span>جدول للامتحانات والعد التنازلي للمذاكرة الفعالة.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
            <span>مساعد ذكي ييسّر الدروس ويلخصها ويختبرك بدون إجابات جاهزة.</span>
          </div>
        </div>

        <button id="btn-start-now" class="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition transform active:scale-95 text-base sm:text-lg flex items-center justify-center gap-2">
          <span>ابدأ الآن</span>
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  modalOverlay.querySelector('#btn-start-now').addEventListener('click', () => {
    renderOnboardingStep2(modalOverlay, onComplete);
  });
}

function renderOnboardingStep2(modalOverlay, onComplete) {
  modalOverlay.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative">
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full">
            الخطوة 2 من 2: الإعداد السريع
          </span>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <h3 class="text-xl font-bold text-gray-900 dark:text-white font-heading mb-2">
          أهلاً بك! لنتعرف عليك سريعاً 🎓
        </h3>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          أدخل اسمك ومرحلتك الدراسية، أو اختر إضافة مهمتك المدرسية الأولى مباشرة.
        </p>

        <form id="onboarding-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">اسمك أو لقبك الدراسي</label>
            <input type="text" id="ob-user-name" value="${store.state.user.name || 'طالب متميز'}" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="مثال: يوسف أو مريم">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">الصف والمرحلة الدراسية</label>
            <select id="ob-user-grade" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="الأول المتوسط">الصف الأول المتوسط (الإعدادي)</option>
              <option value="الثاني المتوسط" selected>الصف الثاني المتوسط (الإعدادي)</option>
              <option value="الثالث المتوسط">الصف الثالث المتوسط (الإعدادي)</option>
              <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
              <option value="المرحلة الثانوية">المرحلة الثانوية</option>
            </select>
          </div>

          <div class="pt-2">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">هل تود إضافة أول مهمة لك الآن؟ (اختياري)</label>
            <input type="text" id="ob-first-task" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="مثال: مراجعة درس العلوم صفحة 24">
          </div>

          <div class="pt-4 flex flex-col gap-3">
            <button type="submit" class="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition text-sm flex items-center justify-center gap-2">
              <span>الدخول إلى لوحة التحكم والانطلاق</span>
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
            <button type="button" id="btn-load-sample" class="w-full py-2.5 px-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition">
              تحميل نموذج بيانات مدرسي كامل جاهز للتجربة
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const form = modalOverlay.querySelector('#onboarding-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modalOverlay.querySelector('#ob-user-name').value;
    const grade = modalOverlay.querySelector('#ob-user-grade').value;
    const firstTaskTitle = modalOverlay.querySelector('#ob-first-task').value;

    store.state.user.name = name.trim() || 'طالب متميز';
    store.state.user.grade = grade;
    
    if (firstTaskTitle && firstTaskTitle.trim()) {
      store.addTask({
        title: firstTaskTitle.trim(),
        subjectId: 'sub_math',
        description: 'مهمتي الأولى في تطبيق مُنجزي',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '18:00',
        priority: 'high',
        notes: 'تمت إضافتها أثناء الإعداد الأول'
      });
    }

    store.setOnboardingComplete(true, name);
    modalOverlay.classList.add('hidden');
    if (onComplete) onComplete();
  });

  modalOverlay.querySelector('#btn-load-sample').addEventListener('click', () => {
    store.resetDefaults();
    store.setOnboardingComplete(true, 'طالب متميز');
    modalOverlay.classList.add('hidden');
    if (onComplete) onComplete();
  });
}
