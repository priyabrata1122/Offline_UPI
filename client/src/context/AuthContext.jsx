import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios instance
  const api = axios.create({
    baseURL: 'http://localhost:8080',
  });

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const response = await axios.get('http://localhost:8080/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            logout();
          }
        } catch (error) {
          logger_error(error);
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  function logger_error(err) {
    console.error('Auth verification error:', err);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
