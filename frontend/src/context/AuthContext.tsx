import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await api('/auth/profile');
          setUser(data.user);
        } catch (error) {
          console.error('Failed to fetch profile', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
