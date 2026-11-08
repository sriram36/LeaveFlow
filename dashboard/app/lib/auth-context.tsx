'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The session cookie is HttpOnly, so the page cannot see it. This non-sensitive flag only
// records "this browser has signed in", so visitors who never did are shown the landing
// page immediately instead of waiting for /auth/me on a possibly sleeping backend.
const SESSION_HINT_KEY = 'leaveflow-session-hint';
const hasSessionHint = () => {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return true; // storage blocked: fall back to checking with the server
  }
};
const setSessionHint = (on: boolean) => {
  try {
    if (on) window.localStorage.setItem(SESSION_HINT_KEY, '1');
    else window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* ignore */
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasSessionHint()) {
      setIsLoading(false);
      return;
    }
    // Check for existing session via HTTP-only cookie
    api.getMe()
      .then(user => {
        // Only allow managers, hr, and admin
        if (user.role === 'worker') {
          api.logout();
          throw new Error('Access denied');
        }
        setUser(user);
      })
      .catch(() => {
        setSessionHint(false);
        api.logout();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const currentUser = await api.getMe();
    
    // Only allow managers, hr, and admin to access dashboard
    if (currentUser.role === 'worker') {
      api.logout();
      throw new Error('Dashboard access is restricted to managers, HR, and admin. Workers should use WhatsApp.');
    }
    
    setSessionHint(true);
    setUser(currentUser);
  };

  const logout = () => {
    setSessionHint(false);
    api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
