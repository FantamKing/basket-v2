import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className="nav-item">
            <i className="expDel_tachometer"></i>
            <span>Dashboard</span>
          </Link>
          
          <Link to="/admin/products" className="nav-item">
            <i className="expDel_box"></i>
            <span>Products</span>
          </Link>
          
          <Link to="/admin/categories" className="nav-item">
            <i className="expDel_list"></i>
            <span>Categories</span>
          </Link>
          
          <Link to="/admin/orders" className="nav-item">
            <i className="expDel_shopping_cart"></i>
            <span>Orders</span>
          </Link>
          
          <Link to="/admin/users" className="nav-item">
            <i className="expDel_users"></i>
            <span>Users</span>
          </Link>
          
          <button onClick={handleLogout} className="nav-item logout-btn">
            <i className="expDel_sign_out"></i>
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header">
          <h1>Basket Admin Dashboard</h1>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;