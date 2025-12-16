import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Express Delivery</h3>
            <p>Your one-stop shop for fresh groceries delivered to your doorstep.</p>
            <p><strong>Main Warehouse:</strong> Devil's hut</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/store">Store</a></li>
              <li><a href="/cart">Cart</a></li>
              <li><a href="/profile">Profile</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <ul>
              <li>Email: gesuscry@gmail.com</li>
              <li>Phone: 7774446660</li>
              <li>Address: Kolkata 700032, God Street</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Payment Methods</h3>
            <p>We accept all major payment methods including UPI, Credit/Debit Cards, and Net Banking.</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Express Delivery. All rights reserved.</p>
          <p>Prices in Indian Rupees (₹) | Free delivery on orders above ₹500</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;