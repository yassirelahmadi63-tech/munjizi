// Subscription Plans Component for Munjizi
import { store } from '../store.js';
import { api } from '../api.js';

export function renderPlans(container, onNavigate) {
  const user = store.state.user;
  if (!user) return;

  const currentPlan = user.plan_id || 'free';
  const aiStats = store.state.aiStats || { requests_used: 0, requests_limit: 10, requests_remaining: 10 };

  container.innerHTML = `
    <div class="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      <!-- Top Title & Subtitle -->
      <div class="text-center space-y-2 max-w-xl mx-auto">
        <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
          باقات مُنجزي التعليمية
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-heading">
          اختر الباقة المناسبة لتفوقك الدراسي 🚀
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          ابدأ مجاناً أو قم بالترقية لباقة المتفوقين للحصول على رصيد ذكاء اصطناعي موسع وإحصائيات متقدمة.
        </p>
      </div>

      <!-- Current Plan Status Banner -->
      <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            ${currentPlan === 'pro' ? '👑' : '⭐'}
          </div>
          <div>
            <span class="text-xs text-gray-400 block">باقتك الحالية:</span>
            <span class="text-sm font-bold text-gray-900 dark:text-white">${user.plan_name_ar || (currentPlan === 'pro' ? 'باقة المتفوقين (PRO)' : 'الباقة المجانية')}</span>
          </div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span class="font-bold text-emerald-600">${aiStats.requests_remaining} طلب AI متبقي</span> من أصل ${aiStats.requests_limit} شهرياً
        </div>
      </div>

      <!-- Plans Comparison Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        <!-- 1. FREE PLAN -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border ${currentPlan === 'free' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-100 dark:border-gray-800'} shadow-sm flex flex-col justify-between relative text-right">
          ${currentPlan === 'free' ? `
            <div class="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
              باقتك المفعلة حالياً
            </div>
          ` : ''}

          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold font-heading text-gray-900 dark:text-white">الباقة المجانية (FREE)</h3>
              <span class="text-xl font-extrabold text-emerald-600 font-heading">0 ر.س</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">
              مثالية لجميع الطلاب لتنظيم المهام المدرسية والمواد الأساسية بسهولة.
            </p>

            <ul class="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>إدارة المهام والواجبات المدرسية الأساسية</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>إدارة المواد الدراسية المقررة (حتى 10 مواد)</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>جدول الامتحانات والعد التنازلي</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>الجدول الدراسي الأسبوعي (من الأحد إلى الخميس)</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>إحصائيات الإنجاز الأسبوعية الأساسية</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">!</span>
                <span>رصيد المساعد الذكي AI: <strong>10 طلبات شهرياً</strong></span>
              </li>
            </ul>
          </div>

          <div class="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
            ${currentPlan === 'free' ? `
              <button disabled class="w-full py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 font-bold rounded-2xl text-xs cursor-default">
                أنت على هذه الباقة حالياً
              </button>
            ` : `
              <button id="btn-downgrade-free" class="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs transition">
                التحويل للباقة المجانية
              </button>
            `}
          </div>
        </div>

        <!-- 2. PRO PLAN -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-2 ${currentPlan === 'pro' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-400'} shadow-lg flex flex-col justify-between relative text-right">
          <div class="absolute -top-3.5 left-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
            <i data-lucide="crown" class="w-3.5 h-3.5"></i>
            <span>الباقة الموصى بها للمتفوقين</span>
          </div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xl font-extrabold font-heading text-gray-900 dark:text-white">باقة المتفوقين (PRO)</h3>
                <span class="text-xs text-amber-600 font-semibold">وصول موسع وغير محدود</span>
              </div>
              <div class="text-left">
                <span class="text-2xl font-black text-amber-600 font-heading">29 ر.س</span>
                <span class="text-[10px] text-gray-400 block">شهرياً (تجريبي)</span>
              </div>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">
              مصممة للطلاب الراغبين في أقصى استفادة من المساعد الذكي لتلخيص المواد وتبسيط الدروس المعقدة.
            </p>

            <ul class="space-y-3 text-xs text-gray-700 dark:text-gray-200">
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span><strong>كل ميزات الباقة المجانية بالكامل</strong></span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>رصيد ذكاء اصطناعي موسع: <strong>200 طلب شهرياً</strong></span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>أدوات متقدمة: تلخيص شامل، كويزات لا محدودة، وتبسيط أسئلة</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>توليد خطط مذاكرة ديناميكية وربطها بالامتحانات مباشرة</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>إضافة مواد مخصصة لا محدودة وملاحظات غير محدودة</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>إحصائيات تحليلية مفصلة لساعات المذاكرة والإنتاجية</span>
              </li>
            </ul>
          </div>

          <div class="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
            ${currentPlan === 'pro' ? `
              <button disabled class="w-full py-3.5 bg-amber-500 text-white font-bold rounded-2xl text-xs shadow-md cursor-default flex items-center justify-center gap-1.5">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>باقتك النشطة حالياً</span>
              </button>
            ` : `
              <button id="btn-upgrade-pro" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold rounded-2xl text-xs shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
                <span>ترقية الحساب إلى PRO الآن (تفعيل فوري)</span>
              </button>
            `}
          </div>
        </div>

      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Upgrade to Pro handler
  container.querySelector('#btn-upgrade-pro')?.addEventListener('click', async () => {
    try {
      const res = await api.upgradePlan('pro');
      alert(res.message || 'تمت الترقية بنجاح!');
      await store.checkSession();
      renderPlans(container, onNavigate);
    } catch (err) {
      alert(err.message || 'فشلت الترقية');
    }
  });

  // Downgrade to Free handler
  container.querySelector('#btn-downgrade-free')?.addEventListener('click', async () => {
    if (confirm('هل ترغب في العودة للباقة المجانية؟')) {
      try {
        await api.upgradePlan('free');
        alert('تم تحويل الباقة إلى المجانية.');
        await store.checkSession();
        renderPlans(container, onNavigate);
      } catch (err) {
        alert(err.message);
      }
    }
  });
}
