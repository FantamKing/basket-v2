import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import './Header.css';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const cartCount = getCartCount();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo">
            <Link to="/">
              <span className="logo-icon">🛒</span>
              <span className="logo-text">Express Delivery</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_home"></i> Home
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_list"></i> Categories
            </NavLink>
            <NavLink to="/store" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_store"></i> Store
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_shopping_cart"></i> Cart
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_user"></i> Profile
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="expDel_sign_in"></i> Login
            </NavLink>
          </nav>

          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className={`theme-icon ${theme === 'light' ? 'moon' : 'sun'}`}></div>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`expDel ${mobileMenuOpen ? 'times' : 'bars'}`}></i>
          </button>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_home"></i> Home
            </NavLink>
            <NavLink to="/categories" onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_list"></i> Categories
            </NavLink>
            <NavLink to="/store" onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_store"></i> Store
            </NavLink>
            <NavLink to="/cart" onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_shopping_cart"></i> Cart {cartCount > 0 && `(${cartCount})`}
            </NavLink>
            <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_user"></i> Profile
            </NavLink>
            <NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>
              <i className="expDel_sign_in"></i> Login
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;