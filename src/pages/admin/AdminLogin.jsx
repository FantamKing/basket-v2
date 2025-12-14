import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = ({ setIsAdmin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', formData);
      
      // Store admin data
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      
      setIsAdmin(true);
      navigate('/admin/dashboard');
      
    } catch (err) {
      console.error('Admin login error:', err);
      // Try to extract structured message or show network error
      const message = err?.response?.data?.message || err.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="admin-logo">
          <div className="admin-icon">
            <i className="expDel_user_shield"></i>
          </div>
          <h1>Basket Admin</h1>
          <p>Administrator Login</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <i className="expDel_exclamation_circle"></i> {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="back-to-store">
          <a href="/">
            <i className="expDel_arrow_left"></i> Back to Store
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;