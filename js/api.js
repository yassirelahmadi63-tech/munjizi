// Munjizi API Client
// Secure token handling, server-enforced authentication & user isolation

const TOKEN_KEY = 'munjizi_auth_token';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
    this.onSuspendedHandler = null;
    this.onUnauthorizedHandler = null;
  }

  setToken(token, remember = true) {
    this.token = token;
    if (token) {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken() {
    return this.token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      // Handle 403 Suspended Account
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === 'ACCOUNT_SUSPENDED') {
          if (this.onSuspendedHandler) {
            this.onSuspendedHandler(errorData.message);
          }
          throw new Error(errorData.message || 'تم تعليق حسابك حالياً. يرجى التواصل مع إدارة مُنجزي.');
        }
      }

      // Handle 401 Unauthorized (Expired / Invalid session)
      if (res.status === 401) {
        this.setToken(null);
        if (this.onUnauthorizedHandler) {
          this.onUnauthorizedHandler();
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'انتهت جلستك، يرجى تسجيل الدخول مجدداً.');
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'حدث خطأ في الخادم.');
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Auth Methods
  async register(name, email, password, schoolLevel) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, school_level: schoolLevel })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async login(email, password, remember = true) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) this.setToken(data.token, remember);
    return data;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
  }

  async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword })
    });
  }

  // Data Bootstrap (Load user's real data)
  async bootstrap() {
    return this.request('/api/data/bootstrap');
  }

  // Tasks
  async createTask(task) {
    return this.request('/api/tasks', { method: 'POST', body: JSON.stringify(task) });
  }

  async updateTask(id, task) {
    return this.request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) });
  }

  async toggleTask(id) {
    return this.request(`/api/tasks/${id}/toggle`, { method: 'POST' });
  }

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, { method: 'DELETE' });
  }

  // Subjects
  async createSubject(subject) {
    return this.request('/api/subjects', { method: 'POST', body: JSON.stringify(subject) });
  }

  async deleteSubject(id) {
    return this.request(`/api/subjects/${id}`, { method: 'DELETE' });
  }

  // Exams
  async createExam(exam) {
    return this.request('/api/exams', { method: 'POST', body: JSON.stringify(exam) });
  }

  async deleteExam(id) {
    return this.request(`/api/exams/${id}`, { method: 'DELETE' });
  }

  // Timetable
  async createTimetableSlot(slot) {
    return this.request('/api/timetable', { method: 'POST', body: JSON.stringify(slot) });
  }

  async deleteTimetableSlot(id) {
    return this.request(`/api/timetable/${id}`, { method: 'DELETE' });
  }

  // Notes
  async createNote(note) {
    return this.request('/api/notes', { method: 'POST', body: JSON.stringify(note) });
  }

  async deleteNote(id) {
    return this.request(`/api/notes/${id}`, { method: 'DELETE' });
  }

  // Study Sessions
  async createStudySession(session) {
    return this.request('/api/study-sessions', { method: 'POST', body: JSON.stringify(session) });
  }

  // AI Assistant (Server-enforced limit)
  async processAI(action, text) {
    return this.request('/api/ai/process', {
      method: 'POST',
      body: JSON.stringify({ action, text })
    });
  }

  // Plans & Subscriptions
  async getPlans() {
    return this.request('/api/plans');
  }

  async upgradePlan(planId) {
    return this.request('/api/plans/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId })
    });
  }

  // Admin APIs (Protected by server-side require_admin())
  async adminGetOverview() {
    return this.request('/api/admin/overview');
  }

  async adminGetUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${qs ? '?' + qs : ''}`);
  }

  async adminUpdateUserPlan(userId, planId) {
    return this.request(`/api/admin/users/${userId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan_id: planId })
    });
  }

  async adminUpdateUserStatus(userId, status) {
    return this.request(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async adminResetUserData(userId) {
    return this.request(`/api/admin/users/${userId}/reset-data`, { method: 'POST' });
  }

  async adminDeleteUser(userId) {
    return this.request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  }

  async adminGetPlans() {
    return this.request('/api/admin/plans');
  }

  async adminUpdatePlan(planId, data) {
    return this.request(`/api/admin/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async adminGetSettings() {
    return this.request('/api/admin/settings');
  }

  async adminUpdateSettings(data) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async adminSendWarning(userId, message) {
    return this.request(`/api/admin/users/${userId}/warning`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async checkWarning() {
    return this.request('/api/warnings/check');
  }

  async dismissWarning(warningId) {
    return this.request(`/api/warnings/${warningId}/read`, { method: 'POST' });
  }
}

export const api = new ApiClient();
