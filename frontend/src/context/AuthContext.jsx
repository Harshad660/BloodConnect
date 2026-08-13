import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try user endpoint first
        const res = await api.get('/auth/users/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        // Try bloodbank endpoint next
        try {
          const res = await api.get('/bloodbank/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (bbErr) {
          console.error('Session restore failed:', bbErr);
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password, isBloodBank = false) => {
    setLoading(true);
    try {
      const endpoint = isBloodBank ? '/bloodbank/login' : '/auth/login';
      const res = await api.post(endpoint, { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData, isBloodBank = false) => {
    setLoading(true);
    try {
      const endpoint = isBloodBank ? '/bloodbank/signup' : '/auth/signup';
      const res = await api.post(endpoint, userData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      console.error('Signup error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check inputs.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const isBank = user && user.role === 'bloodbank';
      const endpoint = isBank ? '/bloodbank/me' : '/auth/users/me';
      const res = await api.put(endpoint, profileData);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile.',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
