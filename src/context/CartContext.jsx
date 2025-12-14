import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('basketCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('basketCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + (item.quantity || 0), 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  const placeOrder = async (shippingAddress, paymentMethod = 'cod') => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const items = cart.map(item => ({
        productId: item._id,
        quantity: item.quantity
      }));

      const response = await axios.post('/api/order', {
        items,
        shippingAddress,
        paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear cart after successful order
      clearCart();

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Expose derived values for convenience
  const total = getCartTotal();
  const count = getCartCount();

  return (
    <CartContext.Provider
      value={{
          cart,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          getCartCount,
          getCartTotal,
          placeOrder,
          total,
          count
        }}
    >
      {children}
    </CartContext.Provider>
  );
};