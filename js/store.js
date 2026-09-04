// Munjizi Reactive State Store with Real Multi-User Backend Sync
import { api } from './api.js';
import { defaultSubjects, defaultTasks, defaultExams, defaultTimetable, defaultNotes, defaultStudySessions } from './seed-data.js';

const THEME_KEY = 'munjizi_theme';

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = {
      user: null, // Logged-in user object
      isAuthenticated: false,
      isSuspended: false,
      suspendedMessage: '',
      tasks: [],
      subjects: [],
      exams: [],
      timetable: [],
      notes: [],
      studySessions: [],
      aiStats: { requests_used: 0, requests_limit: 10, requests_remaining: 10 },
      isDemoMode: false
    };

    this.initTheme();

    // Hook API events
    api.onSuspendedHandler = (msg) => {
      this.state.isSuspended = true;
      this.state.suspendedMessage = msg || 'تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي.';
      this.notify();
    };

    api.onUnauthorizedHandler = () => {
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.state.tasks = [];
      this.state.subjects = [];
      this.state.exams = [];
      this.state.timetable = [];
      this.state.notes = [];
      this.state.studySessions = [];
      this.notify();
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    });
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.setTheme(savedTheme);
  }

  getTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
    this.notify();
  }

  toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  // --- Authentication & Data Bootstrap ---
  async checkSession() {
    if (!api.isAuthenticated()) {
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.notify();
      return false;
    }

    try {
      const data = await api.bootstrap();
      this.state.user = data.user;
      this.state.isAuthenticated = true;
      this.state.isSuspended = false;
      this.state.tasks = data.tasks || [];
      this.state.subjects = data.subjects || [];
      this.state.exams = data.exams || [];
      this.state.timetable = data.timetable || [];
      this.state.notes = data.notes || [];
      this.state.studySessions = data.studySessions || [];
      this.state.aiStats = data.aiStats || { requests_used: 0, requests_limit: 10, requests_remaining: 10 };
      this.notify();
      return true;
    } catch (e) {
      console.warn('Session verification failed:', e);
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.notify();
      return false;
    }
  }

  async login(email, password, remember = true) {
    const res = await api.login(email, password, remember);
    await this.checkSession();
    return res;
  }

  async register(name, email, password, schoolLevel) {
    const res = await api.register(name, email, password, schoolLevel);
    await this.checkSession();
    return res;
  }

  async logout() {
    await api.logout();
    this.state.user = null;
    this.state.isAuthenticated = false;
    this.state.tasks = [];
    this.state.subjects = [];
    this.state.exams = [];
    this.state.timetable = [];
    this.state.notes = [];
    this.state.studySessions = [];
    this.notify();
  }

  // Optional Demo Seed Data for testing/development
  loadDemoSeedData() {
    this.state.isDemoMode = true;
    this.state.subjects = defaultSubjects;
    this.state.tasks = defaultTasks;
    this.state.exams = defaultExams;
    this.state.timetable = defaultTimetable;
    this.state.notes = defaultNotes;
    this.state.studySessions = defaultStudySessions;
    this.notify();
  }

  // --- Tasks Operations ---
  getTasks() {
    return [...this.state.tasks];
  }

  getTaskById(id) {
    return this.state.tasks.find(t => t.id === id);
  }

  async addTask(taskData) {
    const res = await api.createTask(taskData);
    if (res.task) {
      this.state.tasks.unshift(res.task);
      this.notify();
    }
    return res.task;
  }

  async updateTask(id, updates) {
    await api.updateTask(id, updates);
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.tasks[index] = { ...this.state.tasks[index], ...updates };
      this.notify();
    }
  }

  async toggleTaskCompleted(id) {
    const res = await api.toggleTask(id);
    const task = this.getTaskById(id);
    if (task) {
      task.completed = res.completed;
      this.notify();
    }
  }

  async deleteTask(id) {
    await api.deleteTask(id);
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.notify();
  }

  // --- Subjects Operations ---
  getSubjects() {
    return [...this.state.subjects];
  }

  getSubjectById(id) {
    return this.state.subjects.find(s => s.id === id) || {
      id,
      name: 'مادة دراسية',
      color: 'gray',
      badgeColor: 'bg-gray-500',
      bgLight: 'bg-gray-100 text-gray-800'
    };
  }

  async addSubject(subjectData) {
    const res = await api.createSubject(subjectData);
    if (res.subject) {
      this.state.subjects.push(res.subject);
      this.notify();
    }
    return res.subject;
  }

  async deleteSubject(id) {
    await api.deleteSubject(id);
    this.state.subjects = this.state.subjects.filter(s => s.id !== id);
    this.state.tasks = this.state.tasks.filter(t => t.subjectId !== id);
    this.state.timetable = this.state.timetable.filter(slot => slot.subjectId !== id);
    this.notify();
  }

  // --- Exams Operations ---
  getExams() {
    const today = this.getTodayDateStr();
    return [...this.state.exams]
      .map(exam => {
        const examDate = new Date(exam.date);
        const todayDate = new Date(today);
        const diffTime = examDate - todayDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...exam,
          daysRemaining: diffDays,
          isToday: diffDays === 0,
          isUpcoming: diffDays > 0,
          isPast: diffDays < 0
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async addExam(examData) {
    const res = await api.createExam(examData);
    if (res.exam) {
      this.state.exams.push(res.exam);
      this.notify();
    }
    return res.exam;
  }

  async deleteExam(id) {
    await api.deleteExam(id);
    this.state.exams = this.state.exams.filter(e => e.id !== id);
    this.notify();
  }

  // --- Timetable Operations ---
  getTimetable() {
    return [...this.state.timetable];
  }

  async addTimetableSlot(slotData) {
    const res = await api.createTimetableSlot(slotData);
    if (res.slot) {
      this.state.timetable.push(res.slot);
      this.notify();
    }
    return res.slot;
  }

  async deleteTimetableSlot(id) {
    await api.deleteTimetableSlot(id);
    this.state.timetable = this.state.timetable.filter(s => s.id !== id);
    this.notify();
  }

  // --- Notes Operations ---
  getNotesBySubject(subjectId) {
    return this.state.notes.filter(n => n.subjectId === subjectId);
  }

  async addNote(subjectId, title, content) {
    const res = await api.createNote({ subjectId, title, content });
    if (res.note) {
      this.state.notes.unshift(res.note);
      this.notify();
    }
    return res.note;
  }

  async deleteNote(id) {
    await api.deleteNote(id);
    this.state.notes = this.state.notes.filter(n => n.id !== id);
    this.notify();
  }

  // --- Study Sessions Operations ---
  async logStudySession(subjectId, durationMinutes, topic = 'جلسة مذاكرة') {
    const res = await api.createStudySession({ subjectId, durationMinutes, topic });
    if (res.session) {
      this.state.studySessions.unshift(res.session);
      this.notify();
    }
    return res.session;
  }

  // --- AI Assistant with server quota ---
  async processAI(action, text) {
    const res = await api.processAI(action, text);
    if (res.ai_stats) {
      this.state.aiStats = res.ai_stats;
      this.notify();
    }
    return res;
  }

  // --- Helper Queries & Dynamic Calculations ---
  getTodayDateStr() {
    return new Date().toISOString().split('T')[0];
  }

  getTodayTasks() {
    const today = this.getTodayDateStr();
    return this.state.tasks.filter(t => t.dueDate === today);
  }

  getUpcomingTasks() {
    const today = this.getTodayDateStr();
    return this.state.tasks.filter(t => t.dueDate > today && !t.completed);
  }

  getOverdueTasks() {
    const today = this.getTodayDateStr();
    return this.state.tasks.filter(t => t.dueDate < today && !t.completed);
  }

  getWeeklyProgress() {
    const total = this.state.tasks.length;
    const completed = this.state.tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      completed,
      total,
      percentage,
      pending: total - completed,
      overdue: this.getOverdueTasks().length
    };
  }

  getNotifications() {
    const today = this.getTodayDateStr();
    const notifications = [];

    const overdue = this.getOverdueTasks();
    if (overdue.length > 0) {
      notifications.push({
        id: 'notif_overdue',
        type: 'danger',
        title: 'مهام متأخرة بحاجة لإنجاز',
        message: `لديك ${overdue.length} مهمة متأخرة تجاوزت موعد تسليمها المحدد.`,
        actionTab: 'tasks',
        count: overdue.length
      });
    }

    const todayTasks = this.getTodayTasks().filter(t => !t.completed);
    if (todayTasks.length > 0) {
      notifications.push({
        id: 'notif_today',
        type: 'info',
        title: 'مهام مستحقة اليوم',
        message: `لديك ${todayTasks.length} مهام دراسية تتطلب إنجازها اليوم.`,
        actionTab: 'tasks',
        count: todayTasks.length
      });
    }

    const exams = this.getExams().filter(e => e.isUpcoming && e.daysRemaining <= 5);
    exams.forEach(exam => {
      const subject = this.getSubjectById(exam.subjectId);
      notifications.push({
        id: 'notif_exam_' + exam.id,
        type: 'warning',
        title: `اقتراب موعد امتحان ${subject.name}`,
        message: `امتحان "${exam.name}" بعد ${exam.daysRemaining === 1 ? 'يوم واحد' : exam.daysRemaining + ' أيام'}!`,
        actionTab: 'exams',
        count: 1
      });
    });

    return notifications;
  }
}

export const store = new Store();
