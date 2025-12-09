// API client for FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'worker' | 'manager' | 'hr' | 'admin';
  manager_id?: number;
  created_at: string;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  casual: number;
  sick: number;
  special: number;
  year: number;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  days: number;
  leave_type: 'casual' | 'sick' | 'special';
  duration_type: 'full' | 'half_morning' | 'half_afternoon';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  user?: User;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  file_url: string;
  file_type?: string;
  uploaded_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
}

export interface DashboardStats {
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  on_leave_today: User[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe(): Promise<User> {
    return this.fetch('/auth/me');
  }

  // Leave requests
  async getPendingRequests(): Promise<LeaveRequest[]> {
    return this.fetch('/leave/pending');
  }

  async getLeaveHistory(status?: string, userId?: number): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (userId) params.append('user_id', userId.toString());
    return this.fetch(`/leave/history?${params}`);
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/${id}`);
  }

  async approveLeave(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/approve/${id}`, { method: 'POST' });
  }

  async rejectLeave(id: number, reason: string): Promise<LeaveRequest> {
    return this.fetch(`/leave/reject/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelLeave(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/cancel/${id}`, { method: 'POST' });
  }

  async getMyBalance(): Promise<LeaveBalance> {
    return this.fetch('/leave/balance');
  }

  async getUserBalance(userId: number): Promise<LeaveBalance> {
    return this.fetch(`/leave/balance/${userId}`);
  }

  async getTodayLeaves(): Promise<{ employees: User[]; count: number }> {
    return this.fetch('/leave/today');
  }

  // Users
  async getUsers(role?: string): Promise<User[]> {
    const path = role ? `/users/?role=${role}` : '/users/';
    return this.fetch(path);
  }

  async getMyTeam(): Promise<User[]> {
    return this.fetch('/users/team');
  }

  async getUser(id: number): Promise<User & { leave_balance?: LeaveBalance }> {
    return this.fetch(`/users/${id}`);
  }

  // Registration
  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }): Promise<User> {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Holidays
  async getHolidays(year?: number): Promise<Holiday[]> {
    const path = year ? `/holidays/?year=${year}` : '/holidays/';
    return this.fetch(path);
  }

  async createHoliday(date: string, name: string, description?: string): Promise<Holiday> {
    return this.fetch('/holidays/', {
      method: 'POST',
      body: JSON.stringify({ date, name, description }),
    });
  }

  async deleteHoliday(id: number): Promise<void> {
    return this.fetch(`/holidays/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
