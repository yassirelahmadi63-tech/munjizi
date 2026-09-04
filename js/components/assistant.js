// AI Study Assistant Component for Munjizi
// Connected to Backend Server Quota & Limits Enforcement
import { store } from '../store.js';
import { sampleLessons } from '../seed-data.js';

let selectedAction = 'summarize';
let activeResult = null;
let currentQuizState = null;

export function renderAssistant(container, onNavigate, initialOptions = {}) {
  if (initialOptions.action) {
    selectedAction = initialOptions.action;
  }

  const aiStats = store.state.aiStats || { requests_used: 0, requests_limit: 10, requests_remaining: 10 };
  const user = store.state.user || {};

  const actionsList = [
    { id: 'summarize', icon: 'book-open', title: 'تلخيص درس', desc: 'أفكار رئيسية، نقاط هامة، وملخص موجز للمراجعة', color: 'emerald' },
    { id: 'simplify', icon: 'brain', title: 'تبسيط درس', desc: 'شرح المادة الصعبة بلغة ميسرة وأمثلة تقريبية', color: 'cyan' },
    { id: 'notes', icon: 'file-text', title: 'تحويل إلى ملاحظات', desc: 'تنظيم الدرس في نقاط محددة وبطاقات سريعة', color: 'indigo' },
    { id: 'questions', icon: 'help-circle', title: 'أسئلة للمراجعة', desc: 'أسئلة فهم من الدرس مع إخفاء الإجابات للاختبار الذاتي', color: 'amber' },
    { id: 'quiz', icon: 'target', title: 'اختبرني (كويز)', desc: 'اختبار تفاعلي متعدد الخيارات مع تصحيح فوري وتوضيح', color: 'rose' },
    { id: 'concept', icon: 'sparkles', title: 'شرح مفهوم', desc: 'تفكيك مصطلح أو فكرة علمية صعبة وتوضيحها بالتشبيهات', color: 'purple' },
    { id: 'plan', icon: 'calendar', title: 'خطة مذاكرة', desc: 'تحويل امتحاناتك ومهامك إلى جدول مراجعة يومي واقعي', color: 'teal' },
    { id: 'simplify_q', icon: 'refresh-cw', title: 'تبسيط سؤالي', desc: 'توضيح المطلوب من المسألة قبل إرشادك لحلها بفهم', color: 'blue' },
  ];

  const currentActionMeta = actionsList.find(a => a.id === selectedAction) || actionsList[0];

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Top Assistant Header -->
      <div class="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 dark:from-teal-950 dark:via-emerald-950 dark:to-cyan-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200 shrink-0 shadow-md">
              <i data-lucide="bot" class="w-8 h-8"></i>
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold mb-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i>
                <span>المساعد التعليمي الذكي</span>
              </div>
              <h1 class="text-2xl font-extrabold font-heading">
                مساعد مُنجزي للمذاكرة والفهم
              </h1>
              <p class="text-xs sm:text-sm text-teal-100 mt-0.5 max-w-xl">
                هنا لمساعدتك على فهم وتلخيص ومراجعة دروسك المدرسية، وليس لإعطائك إجابات جاهزة دون فهم!
              </p>
            </div>
          </div>

          <!-- Quota Badge -->
          <div class="flex items-center gap-2">
            <div class="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md text-right border border-white/10">
              <span class="text-[10px] text-teal-200 block">رصيد الاستهلاك (${user.plan_name_ar || 'Free'})</span>
              <span class="text-xs font-extrabold font-mono">${aiStats.requests_remaining} طلب متبقي من ${aiStats.requests_limit}</span>
            </div>
            ${user.plan_id !== 'pro' ? `
              <button id="btn-upgrade-ai" class="py-2 px-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <i data-lucide="crown" class="w-3.5 h-3.5"></i>
                <span>ترقية لـ PRO</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Section: "ماذا تريد أن تفعل؟" -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-gray-900 dark:text-white font-heading flex items-center gap-2">
            <span>ماذا تريد أن تفعل؟</span>
          </h2>
          <span class="text-xs text-gray-400">اختر نوع المساعدة المطلوب</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${actionsList.map(act => {
            const isSelected = selectedAction === act.id;
            return `
              <div class="action-card p-4 rounded-3xl border transition cursor-pointer text-right flex flex-col justify-between hover-lift ${isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 hover:border-gray-300'}" data-action="${act.id}">
                <div>
                  <div class="w-10 h-10 rounded-2xl mb-2.5 flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}">
                    <i data-lucide="${act.icon}" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    ${act.title}
                  </h3>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    ${act.desc}
                  </p>
                </div>
                ${isSelected ? `
                  <div class="mt-3 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/40 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                    <span>مُحدد حالياً</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Input Workbench -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">
              إدخال الدرس أو السؤال لـ: <span class="text-emerald-600 dark:text-emerald-400">${currentActionMeta.title}</span>
            </h3>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">دروس نموذجية للتجربة:</span>
            <select id="sample-lessons-select" class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs">
              <option value="">-- اختر درساً للاختبار --</option>
              ${sampleLessons.map(l => `<option value="${l.id}">${l.title}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <textarea id="ai-input-text" rows="5" placeholder="الصق نص الدرس المدرسي هنا، أو اكتب السؤال والمفهوم الذي ترغب في تبسيطه وتلخيصه..." class="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed">${initialOptions.lessonText || ''}</textarea>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div class="flex items-center gap-3">
            <label class="cursor-pointer px-3.5 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 transition">
              <i data-lucide="file-up" class="w-4 h-4 text-emerald-600"></i>
              <span>رفع ملف (.txt / .md)</span>
              <input type="file" id="ai-file-upload" accept=".txt,.md" class="hidden">
            </label>
            <span id="file-name-indicator" class="text-xs text-gray-400"></span>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-clear-ai-input" class="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 font-bold transition">
              مسح
            </button>
            <button id="btn-execute-ai" class="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-xs sm:text-sm transition flex items-center justify-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>معالجة الدرس الآن</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Result Container -->
      <div id="ai-result-section" class="${activeResult ? '' : 'hidden'} space-y-4"></div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  container.querySelector('#btn-upgrade-ai')?.addEventListener('click', () => onNavigate('plans'));

  // Action Cards Click
  container.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedAction = card.dataset.action;
      renderAssistant(container, onNavigate, {
        lessonText: container.querySelector('#ai-input-text')?.value
      });
    });
  });

  // Sample select
  const sampleSelect = container.querySelector('#sample-lessons-select');
  if (sampleSelect) {
    sampleSelect.addEventListener('change', (e) => {
      const sample = sampleLessons.find(s => s.id === e.target.value);
      if (sample) {
        const textarea = container.querySelector('#ai-input-text');
        if (textarea) textarea.value = sample.text;
      }
    });
  }

  // File upload
  const fileUpload = container.querySelector('#ai-file-upload');
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textarea = container.querySelector('#ai-input-text');
          if (textarea) textarea.value = event.target.result;
          const indicator = container.querySelector('#file-name-indicator');
          if (indicator) indicator.textContent = `تم تحميل: ${file.name}`;
        };
        reader.readAsText(file);
      }
    });
  }

  // Clear
  container.querySelector('#btn-clear-ai-input')?.addEventListener('click', () => {
    const textarea = container.querySelector('#ai-input-text');
    if (textarea) textarea.value = '';
    activeResult = null;
    const resSec = container.querySelector('#ai-result-section');
    if (resSec) resSec.classList.add('hidden');
  });

  // Execute
  container.querySelector('#btn-execute-ai')?.addEventListener('click', async () => {
    const text = container.querySelector('#ai-input-text')?.value;
    if (!text || !text.trim()) {
      alert('يرجى لصق نص الدرس أو كتابة السؤال أولاً!');
      return;
    }
    await executeAction(container, selectedAction, text.trim(), onNavigate);
  });
}

// Execute Action with Server Quota Check
async function executeAction(container, actionId, inputText, onNavigate) {
  const resultContainer = container.querySelector('#ai-result-section');
  if (!resultContainer) return;

  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = `
    <div class="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 text-center space-y-3">
      <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
        <i data-lucide="sparkles" class="w-6 h-6"></i>
      </div>
      <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">جاري فحص الرصيد ومعالجة الدرس تربوياً...</h3>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  try {
    // 1. Call server to record usage and verify quota
    await store.processAI(actionId, inputText);

    // 2. Generate pedagogical structured output
    activeResult = generatePedagogicalOutput(actionId, inputText);
    renderOutputResult(container);

    // Refresh assistant header quota counter
    const aiStats = store.state.aiStats;
    const quotaText = container.querySelector('.font-mono');
    if (quotaText && aiStats) {
      quotaText.textContent = `${aiStats.requests_remaining} طلب متبقي من ${aiStats.requests_limit}`;
    }
  } catch (err) {
    resultContainer.innerHTML = `
      <div class="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-rose-200 text-rose-700 flex items-center justify-center mx-auto">
          <i data-lucide="alert-circle" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-bold text-rose-800 dark:text-rose-200">${err.message}</h4>
        <button id="btn-err-upgrade" class="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-md">
          الترقية إلى باقة المتفوقين (PRO) للحصول على 200 طلب شهرياً
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    resultContainer.querySelector('#btn-err-upgrade')?.addEventListener('click', () => {
      if (onNavigate) onNavigate('plans');
    });
  }
}

// Pedagogical Generator
function generatePedagogicalOutput(actionId, text) {
  const sentences = text.split(/[.\n!؟]/).map(s => s.trim()).filter(s => s.length > 5);
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  const termsMap = {};
  words.forEach(w => {
    const clean = w.replace(/[،.:"()]/g, '');
    if (clean.length > 3 && !['هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'الذين', 'حيث', 'كانت', 'يكون', 'على', 'إلى', 'عن'].includes(clean)) {
      termsMap[clean] = (termsMap[clean] || 0) + 1;
    }
  });
  const topKeywords = Object.keys(termsMap).sort((a, b) => termsMap[b] - termsMap[a]).slice(0, 6);

  if (actionId === 'summarize') {
    return {
      type: 'summarize',
      title: 'ملخص شامل وموجز للدرس',
      mainIdeas: sentences.slice(0, 3).map((s, i) => `الفكرة ${i + 1}: ${s}`),
      keyPoints: sentences.slice(2, 6),
      shortSummary: sentences.slice(0, 2).join('. ') + '.',
      vocabulary: topKeywords.map(k => ({ term: k, desc: `مفهوم رئيسي ورد ذكره وتكراره في الدرس للمراجعة والتركيز.` }))
    };
  }

  if (actionId === 'simplify') {
    return {
      type: 'simplify',
      title: 'تبسيط الدرس بلغة سهلة وأمثلة تقريبية',
      friendlyIntro: 'تخيل هذا الدرس وكأنه قصة بسيطة في حياتنا اليومية!',
      simpleParagraphs: sentences.slice(0, 4).map(s => `💡 ببساطة: ${s}`),
      realWorldAnalogy: `مثلما تحتاج السيارة إلى وقود ومحرك لتعمل بنظام، فإن هذا المفهوم يعتمد على ترابط أجزائه معاً لتحقيق الهدف.`,
      goldenAdvice: 'تذكر دائماً: الفهم المنطقي للدرس يجعل حفظ التفاصيل سهلاً وتلقائياً.'
    };
  }

  if (actionId === 'notes') {
    return {
      type: 'notes',
      title: 'بطاقات الملاحظات الذكية (Smart Notes)',
      bulletPoints: sentences.slice(0, 7).map(s => `• ${s}`),
      examAlert: `تنبيه المعلم للاختبار: ركز جيداً على المصطلحات التالية: (${topKeywords.join('، ')}) لأنها موضع أسئلة ومقارنات دقيقة.`
    };
  }

  if (actionId === 'questions') {
    return {
      type: 'questions',
      title: 'أسئلة مراجعة وتحدي ذاتي (الإجابات مخفية)',
      questions: sentences.slice(0, 4).map((s, i) => ({
        id: i,
        q: `س${i + 1}: اشرح كيف وضح الدرس المفهوم المرتبط بـ (${topKeywords[i % topKeywords.length] || 'الموضوع'})؟`,
        answer: s
      }))
    };
  }

  if (actionId === 'quiz') {
    return {
      type: 'quiz',
      title: 'اختبار تفاعلي سريع (Quiz Me)',
      quizQuestions: [
        {
          id: 1,
          question: `ما هي الفكرة الجوهرية التي يركز عليها هذا النص المدرسي؟`,
          options: [
            sentences[0] || 'التعريف الشامل للمفهوم وخصائصه الأساسية',
            'مجرد معلومات عامة دون تطبيق علمي',
            'قواعد لغوية غير مرتبطة بموضوع الدرس'
          ],
          correct: 0,
          explanation: 'الخيار الأول يمثل الفكرة الرئيسية الواردة في مقدمة النص.'
        },
        {
          id: 2,
          question: `ما هو المصطلح أو الركيزة الأهم المذكورة في الدرس؟`,
          options: [
            'عناصر ثانوية غير أساسية',
            topKeywords[0] || 'المصطلح العلمي الأساسي للموضوع',
            'أمثلة قديمة غير مستخدمة'
          ],
          correct: 1,
          explanation: `مصطلح (${topKeywords[0] || 'الدرس'}) هو الركيزة التي تدور حولها تفاصيل الشرح.`
        }
      ]
    };
  }

  if (actionId === 'concept') {
    return {
      type: 'concept',
      title: 'شرح وتفكيك المفهوم الدراسي',
      conceptName: topKeywords[0] || 'المفهوم المستهدف',
      whatIsIt: sentences[0] || 'فكرة علمية أو قاعدة هامة في هذا المقرر.',
      whyItMatters: 'أهميته تكمن في أنه يبني الأساس للدروس القادمة ويفسر الظواهر والتطبيقات المحيطة بنا.',
      simpleAnalogy: 'تشبيه توضيحي: مثل حجر الأساس في البناء، إذا فهمته أصبحت كل التفاصيل التالية سهلة وممتعة.',
      commonMistake: 'خطأ شائع يجب تجنبه: الاعتماد على الحفظ الصم دون إدراك السبب والتسلسل المنطقي.'
    };
  }

  if (actionId === 'plan') {
    return {
      type: 'plan',
      title: 'خطة مذاكرة مقترحة للأيام القادمة',
      overview: `جدول مراجعة متوازن ومقسم حسب وقتك:`,
      days: [
        { day: 'اليوم الأول', focus: 'مراجعة وتلخيص الأفكار والمفردات الصعبة', duration: '45 دقيقة', tip: 'استخدم مؤقت المذاكرة (25 دقيقة تركيز + 5 دقائق استراحة)' },
        { day: 'اليوم الثاني', focus: 'حل التمارين وأسئلة نهاية الدرس وتطبيق القوانين', duration: '50 دقيقة', tip: 'اكتب الحلول بنفسك في الدفتر دون النظر للنموذج أولاً' }
      ]
    };
  }

  if (actionId === 'simplify_q') {
    return {
      type: 'simplify_q',
      title: 'تبسيط وتفكيك السؤال المدرسي',
      whatIsAsked: 'ماذا يطلب منك السؤال بالضبط؟ المطلوب هو تحديد العلاقة بين المعطيات واستنتاج النتيجة بناءً على القواعد المدروسة.',
      thinkingSteps: [
        '1. اقرأ السؤال مرتين وحدد الكلمات المفتاحية والمعطيات.',
        '2. اسأل نفسك: أي درس أو قاعدة من كتابي تعالج هذا النوع من المسائل؟',
        '3. اكتب المعطيات في مسودة وحدد المجهول المطلوب حسابه أو إعرابه.'
      ],
      guidingHint: '💡 تلميح للمساعدة: ابدأ بتطبيق القانون المباشر، وتأكد من أن كل الوحدات والمصطلحات متطابقة قبل كتابة الإجابة النهائية.'
    };
  }

  return { type: 'text', title: 'تحليل المساعد الذكي', content: sentences.join('\n\n') };
}

// Render Result
function renderOutputResult(container) {
  const resContainer = container.querySelector('#ai-result-section');
  if (!resContainer || !activeResult) return;

  let contentHtml = '';

  if (activeResult.type === 'summarize') {
    contentHtml = `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
          <h4 class="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">الأفكار الرئيسية:</h4>
          <ul class="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
            ${activeResult.mainIdeas.map(idea => `<li class="flex items-start gap-1.5"><span class="text-emerald-600 font-bold">•</span><span>${idea}</span></li>`).join('')}
          </ul>
        </div>
        <div class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800">
          <h4 class="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">النقاط الهامة للتذكر:</h4>
          <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            ${activeResult.keyPoints.map(pt => `<li class="flex items-start gap-1.5"><span class="text-teal-500">✓</span><span>${pt}</span></li>`).join('')}
          </ul>
        </div>
        <div class="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-800/40">
          <h4 class="text-xs font-bold text-cyan-800 dark:text-cyan-300 mb-1">ملخص موجز:</h4>
          <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">${activeResult.shortSummary}</p>
        </div>
        <div class="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40">
          <h4 class="text-xs font-bold text-purple-800 dark:text-purple-300 mb-2">مفردات ومصطلحات هامة:</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${activeResult.vocabulary.map(v => `<div class="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 text-xs"><strong class="text-purple-700">${v.term}:</strong> ${v.desc}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (activeResult.type === 'simplify') {
    contentHtml = `
      <div class="space-y-3">
        <div class="p-3 bg-cyan-50 dark:bg-cyan-950/30 text-xs font-bold text-cyan-900 dark:text-cyan-200 rounded-xl">${activeResult.friendlyIntro}</div>
        ${activeResult.simpleParagraphs.map(p => `<div class="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-xs text-gray-700 dark:text-gray-200">${p}</div>`).join('')}
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 rounded-xl"><strong>تشبيه:</strong> ${activeResult.realWorldAnalogy}</div>
        <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-center">${activeResult.goldenAdvice}</div>
      </div>
    `;
  } else if (activeResult.type === 'notes') {
    contentHtml = `
      <div class="space-y-3">
        <div class="space-y-1.5 text-xs">
          ${activeResult.bulletPoints.map(b => `<div class="p-2 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">${b}</div>`).join('')}
        </div>
        <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-200 font-bold">⚠️ ${activeResult.examAlert}</div>
      </div>
    `;
  } else if (activeResult.type === 'questions') {
    contentHtml = `
      <div class="space-y-3">
        ${activeResult.questions.map(q => `
          <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 class="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100">${q.q}</h4>
            <div>
              <button class="btn-reveal-answer text-xs font-bold text-emerald-600 hover:underline" data-id="${q.id}">عرض الإجابة النموذجية</button>
              <div id="answer-box-${q.id}" class="hidden mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">${q.answer}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (activeResult.type === 'quiz') {
    contentHtml = `
      <form id="quiz-form" class="space-y-4">
        ${activeResult.quizQuestions.map((q, idx) => `
          <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 class="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100">${idx + 1}. ${q.question}</h4>
            <div class="space-y-1.5 text-xs">
              ${q.options.map((opt, oIdx) => `
                <label class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                  <input type="radio" name="q_${q.id}" value="${oIdx}" required>
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
            <div id="quiz-fb-${q.id}" class="hidden p-2 rounded-xl text-xs"></div>
          </div>
        `).join('')}
        <button type="submit" class="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md">تصحيح الاختبار وعرض النتيجة</button>
      </form>
    `;
  } else if (activeResult.type === 'concept') {
    contentHtml = `
      <div class="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 text-xs space-y-2">
        <h3 class="text-base font-bold text-purple-900 dark:text-purple-200">${activeResult.conceptName}</h3>
        <p>${activeResult.whatIsIt}</p>
        <p><strong>الأهمية:</strong> ${activeResult.whyItMatters}</p>
        <p><strong>تشبيه:</strong> ${activeResult.simpleAnalogy}</p>
        <p class="text-rose-600"><strong>خطأ شائع:</strong> ${activeResult.commonMistake}</p>
      </div>
    `;
  } else if (activeResult.type === 'plan') {
    contentHtml = `
      <div class="space-y-3 text-xs">
        <p>${activeResult.overview}</p>
        ${activeResult.days.map(d => `<div class="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl"><strong class="text-teal-600">${d.day}:</strong> ${d.focus} (${d.duration}) - <em>${d.tip}</em></div>`).join('')}
      </div>
    `;
  } else if (activeResult.type === 'simplify_q') {
    contentHtml = `
      <div class="space-y-3 text-xs">
        <div class="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-900 dark:text-blue-200">🔍 ${activeResult.whatIsAsked}</div>
        <div class="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1">
          <strong>خطوات التفكير:</strong>
          ${activeResult.thinkingSteps.map(s => `<div>${s}</div>`).join('')}
        </div>
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 rounded-xl">${activeResult.guidingHint}</div>
      </div>
    `;
  }

  resContainer.innerHTML = `
    <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 animate-pop-in">
      <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-heading">${activeResult.title}</h3>
        <button id="btn-save-ai-note" class="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
          حفظ في ملاحظات المادة
        </button>
      </div>
      ${contentHtml}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Reveal Answers
  resContainer.querySelectorAll('.btn-reveal-answer').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.id;
      const box = resContainer.querySelector(`#answer-box-${qid}`);
      if (box) {
        box.classList.toggle('hidden');
        btn.textContent = box.classList.contains('hidden') ? 'عرض الإجابة النموذجية' : 'إخفاء الإجابة';
      }
    });
  });

  // Quiz submission
  const quizForm = resContainer.querySelector('#quiz-form');
  if (quizForm && activeResult.type === 'quiz') {
    quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let score = 0;
      activeResult.quizQuestions.forEach(q => {
        const sel = quizForm.querySelector(`input[name="q_${q.id}"]:checked`);
        const fb = resContainer.querySelector(`#quiz-fb-${q.id}`);
        if (sel) {
          const val = parseInt(sel.value);
          if (val === q.correct) {
            score++;
            if (fb) {
              fb.className = 'p-2 rounded-xl text-xs bg-emerald-50 text-emerald-700';
              fb.textContent = `✓ إجابة صحيحة! ${q.explanation}`;
            }
          } else {
            if (fb) {
              fb.className = 'p-2 rounded-xl text-xs bg-rose-50 text-rose-700';
              fb.textContent = `✗ غير صحيح. الإجابة هي (${q.options[q.correct]}). ${q.explanation}`;
            }
          }
          if (fb) fb.classList.remove('hidden');
        }
      });
      alert(`حصلت على ${score} من ${activeResult.quizQuestions.length}`);
    });
  }

  // Save to notes
  resContainer.querySelector('#btn-save-ai-note')?.addEventListener('click', async () => {
    const subjects = store.getSubjects();
    if (subjects.length === 0) {
      alert('يرجى إضافة مادة دراسية أولاً في قسم المواد لحفظ الملاحظات بها!');
      return;
    }
    const sub = subjects[0];
    await store.addNote(sub.id, activeResult.title, resContainer.innerText.substring(0, 300) + '...');
    alert(`تم حفظ الملاحظة بنجاح في مادة "${sub.name}".`);
  });
}
