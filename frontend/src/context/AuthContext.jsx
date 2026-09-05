import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('codementor_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('codementor_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Session expired:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('codementor_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const demoLogin = async (role = 'user') => {
    const res = await authAPI.demoLogin(role);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('codementor_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    const res = await authAPI.register(username, email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('codementor_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('codementor_token');
    localStorage.removeItem('codementor_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
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
