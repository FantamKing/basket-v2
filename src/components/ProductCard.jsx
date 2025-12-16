import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    addToCart(product);
    // You can add a toast notification here
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-image">
        {/* Ensure images served from backend are requested from backend origin */}
        <img
          src={product.image && (product.image.startsWith('http') ? product.image : `${product.image.startsWith('/') ? '' : '/'}${product.image}`)}
          alt={product.name}
          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.png'; }}
        />
        <button className="quick-view">
          <i className="expDel_eye"></i>
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          <span className="current-price">₹{product.price}</span>
          <span className="unit">/ {product.unit}</span>
        </div>
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          <i className="expDel_cart_plus"></i> Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;