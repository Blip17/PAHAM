// Supabase Client Initialization for PAHAM
// Provides connection to Supabase Auth and Database with local fallback support

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('http') && 
  !SUPABASE_URL.includes('your-project')
);

// In-memory store fallback for node / vitest / SSR environments
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore[key] = value;
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
  },
};

// Fallback Mock Supabase Client for local testing / offline development
function createMockSupabase(): SupabaseClient {
  const listeners: Array<(event: string, session: any) => void> = [];
  const MOCK_STORAGE_KEY = 'paham_mock_supabase_session';
  const MOCK_USERS_KEY = 'paham_mock_supabase_users';

  const getStoredUsers = (): Record<string, { id: string; email: string; password: string; name: string }> => {
    try {
      const raw = safeStorage.getItem(MOCK_USERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveStoredUsers = (users: Record<string, any>) => {
    try {
      safeStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    } catch {}
  };

  const getStoredSession = () => {
    try {
      const raw = safeStorage.getItem(MOCK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setStoredSession = (session: any) => {
    if (session) {
      safeStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(session));
    } else {
      safeStorage.removeItem(MOCK_STORAGE_KEY);
    }
  };

  return {
    auth: {
      async signUp({ email, password, options }: { email: string; password?: string; options?: { data?: { name?: string; display_name?: string } } }) {
        const cleanEmail = email.trim().toLowerCase();
        const users = getStoredUsers();

        if (users[cleanEmail]) {
          return {
            data: { user: null, session: null },
            error: { message: 'User already registered', status: 400 } as any,
          };
        }

        const id = `user-${Date.now()}`;
        const name = options?.data?.name || options?.data?.display_name || cleanEmail.split('@')[0];
        const newUser = { id, email: cleanEmail, password: password || '', name };
        users[cleanEmail] = newUser;
        saveStoredUsers(users);

        const session = {
          user: { id, email: cleanEmail, user_metadata: { name, display_name: name } },
          access_token: `mock-token-${Date.now()}`,
        };
        setStoredSession(session);

        listeners.forEach(l => l('SIGNED_IN', session));
        return { data: { user: session.user, session }, error: null };
      },

      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        const cleanEmail = email.trim().toLowerCase();
        const users = getStoredUsers();
        const found = users[cleanEmail];

        if (!found || (password && found.password !== password)) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', status: 400 } as any,
          };
        }

        const session = {
          user: { id: found.id, email: found.email, user_metadata: { name: found.name, display_name: found.name } },
          access_token: `mock-token-${Date.now()}`,
        };
        setStoredSession(session);

        listeners.forEach(l => l('SIGNED_IN', session));
        return { data: { user: session.user, session }, error: null };
      },

      async signOut() {
        setStoredSession(null);
        listeners.forEach(l => l('SIGNED_OUT', null));
        return { error: null };
      },

      async getSession() {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },

      async getUser() {
        const session = getStoredSession();
        return { data: { user: session?.user || null }, error: null };
      },

      onAuthStateChange(callback: (event: string, session: any) => void) {
        listeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                const idx = listeners.indexOf(callback);
                if (idx !== -1) listeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },
    from(table: string) {
      return {
        select() {
          return {
            async single() {
              return { data: null, error: null };
            },
          };
        },
        async upsert() {
          return { data: null, error: null };
        },
      } as any;
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createMockSupabase();
