import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      // Verify token and get user data
      axios.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem('userToken');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('userToken', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      await axios.post('/signup', userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.put('/user/profile', updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};