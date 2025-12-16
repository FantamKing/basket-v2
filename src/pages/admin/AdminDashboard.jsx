import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      navigate('/admin');
      return;
    }

    try {
      const parsed = JSON.parse(adminData);
      setAdmin(parsed);
    } catch (err) {
      console.error('Failed to parse admin from localStorage:', err);
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
      navigate('/admin');
      return;
    }

    fetchStats();
    fetchRecentOrders();
    setLoading(false);
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Get only the first 5 recent orders
      setRecentOrders(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <span>Logged in as: {admin?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_plus_circle"></i>
          </div>
          <h3>Add Product</h3>
          <p>Add new grocery products to the store</p>
          <button className="card-btn" onClick={() => navigate('/admin/add-product')}>Go to Add Product</button>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_edit"></i>
          </div>
          <h3>Edit Products</h3>
          <p>Manage existing products</p>
          <button className="card-btn" onClick={() => navigate('/admin/products')}>Manage Products</button>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_list"></i>
          </div>
          <h3>Categories</h3>
          <p>Manage product categories</p>
          <button className="card-btn" onClick={() => navigate('/admin/categories')}>Manage Categories</button>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_users"></i>
          </div>
          <h3>Manage Admins</h3>
          <p>Add or remove admin users</p>
          <button className="card-btn" onClick={() => navigate('/admin/admins')}>Manage Admins</button>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_user"></i>
          </div>
          <h3>Manage Users</h3>
          <p>View and edit customer profiles</p>
          <button className="card-btn" onClick={() => navigate('/admin/users')}>Manage Users</button>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="expDel_package"></i>
          </div>
          <h3>Manage Orders</h3>
          <p>View and update order status</p>
          <button className="card-btn" onClick={() => navigate('/admin/orders')}>Manage Orders</button>
        </div>
      </div>

      <div className="quick-stats">
        <h2>Quick Stats</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{stats.totalProducts}</span>
            <span className="stat-label">Total Products</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalOrders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹{stats.totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <div className="orders-header">
          <h2>Recent Orders</h2>
          <button className="view-all-btn" onClick={() => navigate('/admin/orders')}>
            View All Orders
          </button>
        </div>
        <div className="orders-list">
          {recentOrders.length > 0 ? (
            recentOrders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-info">
                  <div className="order-id">Order #{order._id.slice(-8)}</div>
                  <div className="order-customer">{order.userId?.name || 'Unknown'}</div>
                  <div className="order-date">{new Date(order.orderDate).toLocaleDateString()}</div>
                </div>
                <div className="order-details">
                  <div className="order-amount">₹{order.totalAmount.toLocaleString()}</div>
                  <div className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-orders">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;