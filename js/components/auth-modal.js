// Auth Modals & Views Component for Munjizi
import { store } from '../store.js';

let authMode = 'login'; // 'login', 'register', 'forgot', 'reset'
let resetToken = '';

export function renderAuthModal(container, onAuthSuccess) {
  if (!container) return;

  // If user is suspended, show dedicated suspended block
  if (store.state.isSuspended) {
    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900 text-center animate-pop-in space-y-4">
          <div class="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <i data-lucide="shield-alert" class="w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-bold font-heading text-rose-600 dark:text-rose-400">حساب معلّق</h3>
          <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-semibold">
            تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي.
          </p>
          <p class="text-xs text-gray-400">
            إذا كنت تعتقد أن هذا الإجراء تم بالخطأ، يرجى مراسلة الدعم الإداري.
          </p>
          <button id="btn-suspended-logout" class="w-full py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition">
            تسجيل الخروج والعودة
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    container.querySelector('#btn-suspended-logout')?.addEventListener('click', async () => {
      await store.logout();
      container.classList.add('hidden');
      location.reload();
    });
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-right animate-pop-in relative my-8">
        
        <!-- Top Logo -->
        <div class="text-center mb-6">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
            <i data-lucide="sparkles" class="w-7 h-7"></i>
          </div>
          <h2 class="text-2xl font-black font-heading bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            مُنجزي
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">رفيقك المدرسي وإدارة المهام والواجبات</p>
        </div>

        <!-- Mode Switch Tabs -->
        ${(authMode === 'login' || authMode === 'register') ? `
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl mb-5 text-xs font-bold">
            <button id="tab-login" class="flex-1 py-2 rounded-xl transition ${authMode === 'login' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}">
              تسجيل الدخول
            </button>
            <button id="tab-register" class="flex-1 py-2 rounded-xl transition ${authMode === 'register' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}">
              إنشاء حساب جديد
            </button>
          </div>
        ` : ''}

        <div id="auth-alert" class="hidden p-3 rounded-2xl text-xs mb-4"></div>

        <!-- 1. LOGIN FORM -->
        ${authMode === 'login' ? `
          <form id="form-login" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
              <input type="email" id="login-email" required placeholder="student@school.edu" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                <button type="button" id="btn-goto-forgot" class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">نسيت كلمة المرور؟</button>
              </div>
              <input type="password" id="login-password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <button type="submit" id="btn-submit-login" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition text-xs sm:text-sm flex items-center justify-center gap-2">
              <span>تسجيل الدخول</span>
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
          </form>
        ` : ''}

        <!-- 2. REGISTER FORM -->
        ${authMode === 'register' ? `
          <form id="form-register" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">اسم الطالب / الطالبة *</label>
              <input type="text" id="reg-name" required placeholder="مثال: يوسف أحمد" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني *</label>
              <input type="email" id="reg-email" required placeholder="student@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الصف / المرحلة الدراسية</label>
              <select id="reg-grade" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="الأول المتوسط">الصف الأول المتوسط (الإعدادي)</option>
                <option value="الثاني المتوسط" selected>الصف الثاني المتوسط (الإعدادي)</option>
                <option value="الثالث المتوسط">الصف الثالث المتوسط (الإعدادي)</option>
                <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                <option value="المرحلة الثانوية">المرحلة الثانوية</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور (6 أحرف على الأقل) *</label>
              <input type="password" id="reg-password" required minlength="6" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" dir="ltr">
            </div>

            <button type="submit" id="btn-submit-reg" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition text-xs sm:text-sm flex items-center justify-center gap-2">
              <span>إنشاء الحساب وبدء التنظيم</span>
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
          </form>
        ` : ''}

        <!-- 3. FORGOT PASSWORD -->
        ${authMode === 'forgot' ? `
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">استعادة كلمة المرور</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">أدخل بريدك الإلكتروني لإنشاء رمز إعادة تعيين كلمة المرور:</p>
            <form id="form-forgot" class="space-y-3">
              <input type="email" id="forgot-email" required placeholder="student@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100" dir="ltr">
              <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">إرسال رابط الاستعادة</button>
            </form>
            <div class="text-center pt-2">
              <button type="button" id="btn-back-to-login" class="text-xs text-gray-500 hover:underline">العودة لتسجيل الدخول</button>
            </div>
          </div>
        ` : ''}

        <!-- 4. RESET PASSWORD -->
        ${authMode === 'reset' ? `
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white font-heading">تعيين كلمة مرور جديدة</h3>
            <form id="form-reset" class="space-y-3">
              <input type="password" id="reset-new-pwd" required minlength="6" placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100" dir="ltr">
              <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">حفظ كلمة المرور الجديدة</button>
            </form>
          </div>
        ` : ''}

<!-- Quick Credentials Hint for Reviewers removed for security -->

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  container.classList.remove('hidden');

  const alertBox = container.querySelector('#auth-alert');
  const showAlert = (msg, type = 'error') => {
    if (!alertBox) return;
    alertBox.className = `p-3 rounded-2xl text-xs mb-4 ${type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'}`;
    alertBox.textContent = msg;
    alertBox.classList.remove('hidden');
  };

  // Switch tabs
  container.querySelector('#tab-login')?.addEventListener('click', () => {
    authMode = 'login';
    renderAuthModal(container, onAuthSuccess);
  });

  container.querySelector('#tab-register')?.addEventListener('click', () => {
    authMode = 'register';
    renderAuthModal(container, onAuthSuccess);
  });

  container.querySelector('#btn-goto-forgot')?.addEventListener('click', () => {
    authMode = 'forgot';
    renderAuthModal(container, onAuthSuccess);
  });

  container.querySelector('#btn-back-to-login')?.addEventListener('click', () => {
    authMode = 'login';
    renderAuthModal(container, onAuthSuccess);
  });

  // Login Submit
  container.querySelector('#form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#login-email').value.trim();
    const password = container.querySelector('#login-password').value.trim();
    const submitBtn = container.querySelector('#btn-submit-login');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'جاري التحقق...';

    try {
      await store.login(email, password);
      container.classList.add('hidden');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      showAlert(err.message || 'فشل تسجيل الدخول.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>تسجيل الدخول</span>';
    }
  });

  // Register Submit
  container.querySelector('#form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#reg-name').value.trim();
    const email = container.querySelector('#reg-email').value.trim();
    const grade = container.querySelector('#reg-grade').value;
    const password = container.querySelector('#reg-password').value.trim();
    const submitBtn = container.querySelector('#btn-submit-reg');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'جاري إنشاء الحساب...';

    try {
      await store.register(name, email, password, grade);
      container.classList.add('hidden');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      showAlert(err.message || 'فشل إنشاء الحساب.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>إنشاء الحساب وبدء التنظيم</span>';
    }
  });

  // Forgot Submit
  container.querySelector('#form-forgot')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#forgot-email').value.trim();
    try {
      const res = await store.api.forgotPassword(email);
      if (res.reset_token) {
        resetToken = res.reset_token;
        authMode = 'reset';
        renderAuthModal(container, onAuthSuccess);
        showAlert('تم إنشاء رمز الاستعادة بنجاح! أدخل كلمة المرور الجديدة أدناه.', 'success');
      } else {
        showAlert(res.message, 'success');
      }
    } catch (err) {
      showAlert(err.message);
    }
  });

  // Reset Submit
  container.querySelector('#form-reset')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPwd = container.querySelector('#reset-new-pwd').value.trim();
    try {
      await store.api.resetPassword(resetToken, newPwd);
      authMode = 'login';
      renderAuthModal(container, onAuthSuccess);
      showAlert('تم تحديث كلمة المرور بنجاح! تفضل بتسجيل الدخول.', 'success');
    } catch (err) {
      showAlert(err.message);
    }
  });
}
