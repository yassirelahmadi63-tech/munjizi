// Seed Data for Munjizi App
// Realistic Middle School Curriculum Data in Arabic

export const defaultSubjects = [
  {
    id: 'sub_math',
    name: 'الرياضيات',
    code: 'MATH',
    color: 'indigo',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    badgeColor: 'bg-indigo-500',
    icon: 'calculator',
    teacher: 'أ. أحمد الشافعي',
    description: 'الجبر، الهندسة، الإحصاء وحل المعادلات الرياضية'
  },
  {
    id: 'sub_arabic',
    name: 'اللغة العربية',
    code: 'ARABIC',
    color: 'emerald',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeColor: 'bg-emerald-500',
    icon: 'book-open',
    teacher: 'أ. عبد الرحمن',
    description: 'النحو والصرف، القراءة والنصوص، الإملاء والتعبير'
  },
  {
    id: 'sub_science',
    name: 'العلوم',
    code: 'SCI',
    color: 'cyan',
    bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    badgeColor: 'bg-cyan-500',
    icon: 'flask-conical',
    teacher: 'أ. فاطمة الزهراء',
    description: 'أحياء، فيزياء، كيمياء وعلوم الأرض والبيئة'
  },
  {
    id: 'sub_english',
    name: 'اللغة الإنجليزية',
    code: 'ENG',
    color: 'sky',
    bgLight: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    badgeColor: 'bg-sky-500',
    icon: 'languages',
    teacher: 'Mr. David',
    description: 'English Grammar, Vocabulary, Reading Comprehension & Writing'
  },
  {
    id: 'sub_french',
    name: 'اللغة الفرنسية',
    code: 'FR',
    color: 'violet',
    bgLight: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    badgeColor: 'bg-violet-500',
    icon: 'globe',
    teacher: 'Mme. Sophie',
    description: 'Français: Vocabulaire, Grammaire, Conjugaison et Dialogue'
  },
  {
    id: 'sub_social',
    name: 'الاجتماعيات',
    code: 'SOC',
    color: 'amber',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeColor: 'bg-amber-500',
    icon: 'map',
    teacher: 'أ. محمد السعيد',
    description: 'التاريخ والحضارات القديمة، الجغرافيا الطبيعية والتربية الوطنية'
  },
  {
    id: 'sub_islamic',
    name: 'التربية الإسلامية',
    code: 'ISLAM',
    color: 'teal',
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    badgeColor: 'bg-teal-500',
    icon: 'scroll',
    teacher: 'أ. مصطفى نور الدين',
    description: 'القرآن الكريم والتجويد، الحديث الشريف، الفقه والسيرة النبوية'
  }
];

// Helper to calculate realistic relative dates
const now = new Date();
const formatDate = (offsetDays) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const defaultTasks = [
  {
    id: 'task_1',
    title: 'حل تمارين كتاب الجبر صفحة 45 (1 إلى 10)',
    subjectId: 'sub_math',
    description: 'حل مسائل المعادلات الخطية من الدرجة الأولى بمجهول واحد والتحقق من صحة الحل في الدفتر المدرسي.',
    dueDate: formatDate(0), // Today
    dueTime: '17:00',
    priority: 'high', // high, medium, low
    completed: false,
    notes: 'التركيز على مسألة رقم 8 لأن المعلم قال إنها نموذجية للاختبار.',
    createdAt: new Date(now.getTime() - 24 * 3600000).toISOString()
  },
  {
    id: 'task_2',
    title: 'حفظ ومراجعة سورة الملك من الآية 1 إلى 15',
    subjectId: 'sub_islamic',
    description: 'حفظ مع تطبيق أحكام النون الساكنة والتنوين (الإدغام والإقلاب).',
    dueDate: formatDate(0), // Today
    dueTime: '19:30',
    priority: 'medium',
    completed: true,
    notes: 'استمعت إلى تلاوة الشيخ الحصري مرتين وتأكدت من النطق الصحيح.',
    createdAt: new Date(now.getTime() - 48 * 3600000).toISOString()
  },
  {
    id: 'task_3',
    title: 'كتابة موضوع تعبير عن أهمية القراءة',
    subjectId: 'sub_arabic',
    description: 'كتابة مقال من 15 سطراً يحتوي على مقدمة وعرض وخاتمة مع الاستشهاد ببيت شعري.',
    dueDate: formatDate(1), // Tomorrow
    dueTime: '18:00',
    priority: 'high',
    completed: false,
    notes: 'استخدام مفردات راقية ومراعاة علامات الترقيم وتجنب الأخطاء الإملائية.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_4',
    title: 'مشروع العلوم: مجسم أو رسم تخطيطي للخلية النباتية',
    subjectId: 'sub_science',
    description: 'تحديد أجزاء الخلية: الجدار الخلوي، الغشاء البلازمي، النواة، البلاستيدات الخضراء، والفجوة العصارية.',
    dueDate: formatDate(3),
    dueTime: '12:00',
    priority: 'high',
    completed: false,
    notes: 'تلوين الأجزاء بألوان مميزة وتسمية كل جزء بوضوح.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_5',
    title: 'English Vocabulary Quiz Revision (Unit 4)',
    subjectId: 'sub_english',
    description: 'Study 20 new words about Science and Inventions from Student Book page 38.',
    dueDate: formatDate(2),
    dueTime: '16:00',
    priority: 'medium',
    completed: false,
    notes: 'Make flashcards for definitions and sentence examples.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_6',
    title: 'تلخيص درس الدولة العباسية (أبرز الخلفاء والفتوحات)',
    subjectId: 'sub_social',
    description: 'استخراج أسباب ازدهار بغداد وعصر هارون الرشيد والمأمون في خريطة ذهنية.',
    dueDate: formatDate(-1), // Overdue
    dueTime: '20:00',
    priority: 'medium',
    completed: false,
    notes: 'تأخرت بسبب ضيق الوقت، يجب إنجازه الليلة قبل الحصة القادمة.',
    createdAt: new Date(now.getTime() - 72 * 3600000).toISOString()
  },
  {
    id: 'task_7',
    title: 'Devoir de Français: Conjugaison au Présent',
    subjectId: 'sub_french',
    description: 'Exercices 3 et 4 page 52 - Verbes du premier et deuxième groupe.',
    dueDate: formatDate(-2),
    dueTime: '15:00',
    priority: 'low',
    completed: true,
    notes: 'تم الحل ومراجعته مع المعلم في القسم.',
    createdAt: new Date(now.getTime() - 96 * 3600000).toISOString()
  },
  {
    id: 'task_8',
    title: 'حل ورقة تدريبات نظرية فيثاغورس',
    subjectId: 'sub_math',
    description: 'حساب طول الوتر وطول أحد ضلعي القائمة في مثلث قائم الزاوية.',
    dueDate: formatDate(4),
    dueTime: '18:00',
    priority: 'low',
    completed: false,
    notes: 'تطبيق القانون: أ² + ب² = ج²',
    createdAt: new Date().toISOString()
  }
];

export const defaultExams = [
  {
    id: 'exam_1',
    name: 'اختبار منتصف الفصل - الرياضيات',
    subjectId: 'sub_math',
    date: formatDate(3),
    time: '08:30',
    room: 'قاعة 12',
    notes: 'يشمل الدروس: المعادلات الخطية، تحليل كثيرات الحدود، وتطبيقات نظرية فيثاغورس.',
    status: 'upcoming'
  },
  {
    id: 'exam_2',
    name: 'اختبار دوري - مادة العلوم (الأحياء والخلية)',
    subjectId: 'sub_science',
    date: formatDate(6),
    time: '09:45',
    room: 'مختبر العلوم',
    notes: 'التركيز على بنية الخلية، الانقسام الخلوي، والتنفس الخلوي في النبات.',
    status: 'upcoming'
  },
  {
    id: 'exam_3',
    name: 'اختبار لغتي الخالدة - النحو والإملاء',
    subjectId: 'sub_arabic',
    date: formatDate(10),
    time: '08:30',
    room: 'قاعة 5',
    notes: 'يشمل: كان وأخواتها، إن وأخواتها، والهمزة المتطرفة على الألف والواو والياء.',
    status: 'upcoming'
  },
  {
    id: 'exam_4',
    name: 'Midterm English Exam - Reading & Grammar',
    subjectId: 'sub_english',
    date: formatDate(14),
    time: '10:00',
    room: 'Hall 3',
    notes: 'Past continuous, Relative clauses, and reading comprehension text.',
    status: 'upcoming'
  }
];

export const defaultTimetable = [
  { day: 'الأحد', period: 'الحصة 1 (08:00 - 08:45)', subjectId: 'sub_math', room: 'فصل 2/ب' },
  { day: 'الأحد', period: 'الحصة 2 (08:50 - 09:35)', subjectId: 'sub_arabic', room: 'فصل 2/ب' },
  { day: 'الأحد', period: 'الحصة 3 (10:00 - 10:45)', subjectId: 'sub_science', room: 'مختبر العلوم' },
  { day: 'الأحد', period: 'الحصة 4 (10:50 - 11:35)', subjectId: 'sub_islamic', room: 'فصل 2/ب' },
  
  { day: 'الاثنين', period: 'الحصة 1 (08:00 - 08:45)', subjectId: 'sub_english', room: 'معمل اللغات' },
  { day: 'الاثنين', period: 'الحصة 2 (08:50 - 09:35)', subjectId: 'sub_math', room: 'فصل 2/ب' },
  { day: 'الاثنين', period: 'الحصة 3 (10:00 - 10:45)', subjectId: 'sub_social', room: 'فصل 2/ب' },
  { day: 'الاثنين', period: 'الحصة 4 (10:50 - 11:35)', subjectId: 'sub_french', room: 'فصل 2/ب' },

  { day: 'الثلاثاء', period: 'الحصة 1 (08:00 - 08:45)', subjectId: 'sub_science', room: 'مختبر العلوم' },
  { day: 'الثلاثاء', period: 'الحصة 2 (08:50 - 09:35)', subjectId: 'sub_arabic', room: 'فصل 2/ب' },
  { day: 'الثلاثاء', period: 'الحصة 3 (10:00 - 10:45)', subjectId: 'sub_math', room: 'فصل 2/ب' },
  { day: 'الثلاثاء', period: 'الحصة 4 (10:50 - 11:35)', subjectId: 'sub_islamic', room: 'فصل 2/ب' },

  { day: 'الأربعاء', period: 'الحصة 1 (08:00 - 08:45)', subjectId: 'sub_social', room: 'فصل 2/ب' },
  { day: 'الأربعاء', period: 'الحصة 2 (08:50 - 09:35)', subjectId: 'sub_english', room: 'فصل 2/ب' },
  { day: 'الأربعاء', period: 'الحصة 3 (10:00 - 10:45)', subjectId: 'sub_french', room: 'فصل 2/ب' },
  { day: 'الأربعاء', period: 'الحصة 4 (10:50 - 11:35)', subjectId: 'sub_science', room: 'مختبر العلوم' },

  { day: 'الخميس', period: 'الحصة 1 (08:00 - 08:45)', subjectId: 'sub_arabic', room: 'فصل 2/ب' },
  { day: 'الخميس', period: 'الحصة 2 (08:50 - 09:35)', subjectId: 'sub_math', room: 'فصل 2/ب' },
  { day: 'الخميس', period: 'الحصة 3 (10:00 - 10:45)', subjectId: 'sub_islamic', room: 'فصل 2/ب' },
  { day: 'الخميس', period: 'الحصة 4 (10:50 - 11:35)', subjectId: 'sub_english', room: 'فصل 2/ب' }
];

export const defaultNotes = [
  {
    id: 'note_1',
    subjectId: 'sub_science',
    title: 'ملاحظات هامة حول الجهاز الهضمي والإنزيمات',
    content: '1. يبدأ هضم الكربوهيدرات في الفم بواسطة إنزيم الأميليز اللعابي.\n2. المعدة تفرز حمض الهيدروكلوريك (HCl) لتنشيط إنزيم الببسين لهضم البروتينات.\n3. العصارة الصفراوية تُفرز من الكبد وتخزن في المرارة لتفتيت الدهون إلى مستحلب دهني.\n4. الامتصاص الفعلي للغذاء المهضوم يتم في الأمعاء الدقيقة عبر الخملات المعوية.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'note_2',
    subjectId: 'sub_arabic',
    title: 'قاعدة كان وأخواتها وإعرابها السريع',
    content: '• كان وأخواتها أفعال ناسخة ناقصة تدخل على الجملة الاسمية.\n• ترفع المبتدأ ويسمى اسمها، وتنصب الخبر ويسمى خبرها.\n• أشهر أخوات كان: أصبح، أضحى، ظل، أمسى، بات، صار، ليس، ما زال.\n• مثال: كان الجوُّ ماطراً (الجو: اسم كان مرفوع بالضمة، ماطراً: خبر كان منصوب بالفتحة).',
    createdAt: new Date().toISOString()
  }
];

export const defaultStudySessions = [
  {
    id: 'session_1',
    subjectId: 'sub_math',
    durationMinutes: 45,
    topic: 'مراجعة حل المعادلات الخطية',
    date: formatDate(-1)
  },
  {
    id: 'session_2',
    subjectId: 'sub_science',
    durationMinutes: 30,
    topic: 'حفظ وظائف العضيات الخلوية',
    date: formatDate(0)
  }
];

// Rich Curated Middle School Lessons for Instant AI Assistant Testing
export const sampleLessons = [
  {
    id: 'lesson_science_digestive',
    title: 'العلوم: الجهاز الهضمي في جسم الإنسان',
    subject: 'العلوم',
    text: `الجهاز الهضمي هو القناة المسؤولة عن تحويل جزيئات الطعام الكبيرة المعقدة إلى مواد غذائية بسيطة سهلة الامتصاص يستفيد منها الجسم لإنتاج الطاقة وبناء الخلايا.

يبدأ الهضم في الفم حيث تقوم الأسنان بتقطيع الطعام، ويفرز اللعاب إنزيم الأميليز الذي يحلل الكربوهيدرات والنشويات إلى سكريات بسيطة. ثم يمر الطعام عبر البلعوم فالمريء بحركة تسمى الحركة الدودية حتى يصل إلى المعدة.

في المعدة، يُخلط الطعام بالعصارة المعدية التي تحتوي على حمض الهيدروكلوريك وإنزيم الببسين الذي يبدأ بتفكيك البروتينات إلى سلاسل أقصر في بيئة شديدة الحموضة.

بعد ذلك ينتقل الطعام شبه المهضوم (الكيموس) إلى الأمعاء الدقيقة، وتحديداً الاثني عشر، حيث تصب فيه العصارة الصفراوية القادمة من الكبد لتفتيت الدهون، وعصارة البنكرياس التي تحتوي على إنزيمات هاضمة للدهون والبروتينات والنشويات. وفي الأمعاء الدقيقة يتم امتصاص المواد الغذائية الذائبة ونقلها إلى مجرى الدم عبر بروزات دقيقة تسمى الخملات.

أما الماء والأملاح الزائدة وما تبقى من فضلات غير مهضومة، فينتقل إلى الأمعاء الغليظة حيث يعاد امتصاص أغلب الماء، ثم تتجمع الفضلات الصلبة لتُطرح خارج الجسم عبر فتحة الشرج.`
  },
  {
    id: 'lesson_arabic_grammar',
    title: 'اللغة العربية: كان وأخواتها وتأثيرها الإعرابي',
    subject: 'اللغة العربية',
    text: `كان وأخواتها أفعال ناسخة ناقصة تدخل على الجملة الاسمية المكونة من المبتدأ والخبر. 

وسميت "أفعالاً ناسخة" لأنها تنسخ وتغير الحكم الإعرابي للخبر، فبعد أن كان مرفوعاً تجعله منصوباً. وسُميت "ناقصة" لأنها لا تكتفي بمرفوعها (الفاعل) كالأفعال التامة لتكوين جملة مفيدة، بل تحتاج إلى خبر منصوب يتمم معناها.

أشهر أخوات كان:
1. كان: تفيد اتصاف المبتدأ بالخبر في الزمن الماضي (مثل: كان الطالبُ مجتهداً).
2. أصبح: تفيد حصول الخبر في وقت الصباح (مثل: أصبح الجوُّ بارداً).
3. أضحى: تفيد حصول الخبر في وقت الضحى.
4. ظل: تفيد الاستمرار وملازمة الخبر للera (مثل: ظل النورُ ساطعاً).
5. أمسى: تفيد حصول الخبر في وقت المساء.
6. بات: تفيد حصول الخبر في الليل.
7. صار: تفيد التحول والانتقال من حالة إلى أخرى (مثل: صار الدقيقُ خبزاً).
8. ليس: تفيد النفي المطلق في الحاضر (مثل: ليس النجاحُ سهلاً).
9. ما زال، ما برح، ما انفك، ما فتئ: تفيد ملازمة الخبر للاسم والاستمرار.

حكمها الإعرابي:
ترفع المبتدأ ويسمى اسمها (اسم كان مرفوع)، وتنصب الخبر ويسمى خبرها (خبر كان منصوب). وقد يأتي الخبر مفرداً، أو جملة اسمية أو فعلية، أو شبه جملة (جار ومجرور أو ظرف).`
  },
  {
    id: 'lesson_math_pythagoras',
    title: 'الرياضيات: مبرهنة فيثاغورس وتطبيقاتها',
    subject: 'الرياضيات',
    text: `مبرهنة فيثاغورس هي إحدى أهم العلاقات الأساسية في الهندسة الإقليدية، وتطبق حصرياً على المثلثات قائمة الزاوية.

تنص المبرهنة على ما يلي:
"في أي مثلث قائم الزاوية، تكون مساحة المربع المنشأ على الوتر مساوية لمجموع مساحتي المربعين المنشأين على الضلعين القائمين الآخرين".

الصيغة الرياضية:
إذا كان لدينا مثلث قائم الزاوية فيه الضلعان القائمان هما أ و ب، والوتر (وهو أطول أضلاع المثلث ويقابل دائماً الزاوية القائمة قياس 90 درجة) هو ج، فإن:
أ² + ب² = ج²

أهم التطبيقات العملية:
1. إيجاد طول الوتر المجهول: ج = √(أ² + ب²). مثال: إذا كان الضلعان 3 سم و 4 سم، فإن الوتر = √(9 + 16) = √25 = 5 سم.
2. إيجاد أحد الضلعين القائمين: أ² = ج² - ب².
3. عكس نظرية فيثاغورس: إذا كان مجموع مربعي طولي ضلعين في أي مثلث يساوي مربع طول الضلع الثالث، فإن هذا المثلث قائم الزاوية حتماً.

تُستخدم المبرهنة في الحياة اليومية في البناء، والتطبيقات الهندسية، والملاحة وتحديد المسافات المستقيمة في أنظمة الخرائط والملاحة الجوية.`
  },
  {
    id: 'lesson_history_silkroad',
    title: 'الاجتماعيات: طريق الحرير التاريخي وأثره الحضاري',
    subject: 'الاجتماعيات',
    text: `طريق الحرير هو شبكة تاريخية قديمة من الطرق التجارية والبرية والبحرية التي ربطت بين الشرق الأقصى (الصين) وحضارات الشرق الأوسط وجنوب آسيا وصولاً إلى حوض البحر الأبيض المتوسط وأوروبا، وبلغ طولها آلاف الكيلومترات.

سمى الجغرافي الألماني فرديناند فون ريشتهوفن هذا الطريق باسم "طريق الحرير" في القرن التاسع عشر نظراً للأهمية البالغة لتجارة الحرير الصيني الفاخر الذي كان يُنقل إلى الغرب.

أبرز البضائع المتبادلة:
- من الصين والشرق: الحرير، الخزف، التوابل، الشاي، والبارود والورق.
- من العالم العربي والإسلامي: الخيول العربية الأصيلة، العطور، المنسوجات الصوفية والدمشقية، الزجاج الملون، والذهب والفضة.

الأثر الحضاري والثقافي:
لم يكن طريق الحرير مجرد ممر تجاري لنقل البضائع، بل كان جسراً عظيماً للتبادل الفكري والديني والعلمي والتكنولوجي. من خلاله انتقلت تقنيات حاسمة مثل صناعة الورق والطباعة والبوصلة من الصين إلى العالم الإسلامي ومنه إلى أوروبا. كما ازدهرت على طول مساره مدن تاريخية عظيمة مثل سمرقند، بخارى، بغداد، دمشق، والإسكندرية.`
  }
];
