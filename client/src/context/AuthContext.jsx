import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('qe_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('qe_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          localStorage.removeItem('qe_token');
          localStorage.removeItem('qe_refresh_token');
          localStorage.removeItem('qe_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('qe_token', res.data.accessToken);
      localStorage.setItem('qe_refresh_token', res.data.refreshToken);
      localStorage.setItem('qe_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const adminLogin = async (email, password) => {
    const res = await authApi.adminLogin({ email, password });
    if (res.data.success) {
      localStorage.setItem('qe_token', res.data.accessToken);
      localStorage.setItem('qe_refresh_token', res.data.refreshToken);
      localStorage.setItem('qe_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data.success) {
      localStorage.setItem('qe_token', res.data.accessToken);
      localStorage.setItem('qe_refresh_token', res.data.refreshToken);
      localStorage.setItem('qe_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('qe_token');
    localStorage.removeItem('qe_refresh_token');
    localStorage.removeItem('qe_user');
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('qe_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        register,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff' || user?.role === 'admin',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

