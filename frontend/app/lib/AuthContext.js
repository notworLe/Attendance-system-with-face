'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, isLoggedIn } from './auth';

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setRole(userData?.is_superuser ? 'admin' : 'teacher');
        })
        .catch((err) => {
          console.error('Failed to fetch user', err);
          setUser(null);
          setRole(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
