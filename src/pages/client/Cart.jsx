import React from 'react';
import styled from 'styled-components';
import { useCart } from '../../context/CartContext.jsx';
import { useUser } from '../../context/UserContext.jsx';
import Swal from 'sweetalert2';

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const CartTitle = styled.h1`
  font-size: 36px;
  margin-bottom: 30px;
  color: #333;
`;

const CartContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CartItems = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const CartItem = styled.div`
  display: grid;
  grid-template-columns: 100px 2fr 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 768px) {
    grid-template-columns: 80px 1fr;
    gap: 10px;
  }
`;

const ItemImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    grid-row: span 2;
  }
`;

const ItemDetails = styled.div`
  @media (max-width: 768px) {
    grid-column: 2;
  }
`;

const ItemName = styled.h3`
  font-size: 18px;
  margin-bottom: 5px;
  color: #333;
`;

const ItemPrice = styled.p`
  color: #28a745;
  font-weight: 500;
  
  &::before {
    content: '₹';
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    grid-column: 2;
  }
`;

const QuantityButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 5px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const QuantityInput = styled.input`
  width: 50px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 5px;
  
  &:focus {
    outline: none;
    border-color: #28a745;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  font-size: 20px;
  cursor: pointer;
  
  &:hover {
    color: #c82333;
  }
  
  @media (max-width: 768px) {
    grid-column: 2;
    justify-self: end;
  }
`;

const CartSummary = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 100px;
`;

const SummaryTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: ${props => props.total ? '2px solid #333' : '1px solid #eee'};
  font-weight: ${props => props.total ? '600' : 'normal'};
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 50px;
  color: #666;
  
  i {
    font-size: 60px;
    color: #ddd;
    margin-bottom: 20px;
  }
  
  h3 {
    font-size: 24px;
    margin-bottom: 10px;
  }
  
  p {
    margin-bottom: 20px;
  }
`;

const CheckoutButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: 500;
  margin-top: 20px;
  
  &:hover {
    background-color: #218838;
  }
`;

const ContinueButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const Cart = () => {
  const { cart, total, removeFromCart, updateQuantity, clearCart, placeOrder } = useCart();
  const { user } = useUser();
  
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };
  
  const handleCheckout = async () => {
    if (!user) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to place an order',
        icon: 'warning',
        confirmButtonText: 'Login'
      }).then(() => {
        window.location.href = '/login';
      });
      return;
    }

    if (!user.address || !user.address.street) {
      Swal.fire({
        title: 'Address Required',
        text: 'Please update your profile with delivery address',
        icon: 'warning',
        confirmButtonText: 'Update Profile'
      }).then(() => {
        window.location.href = '/profile';
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Order',
      html: `
        <div style="text-align: left;">
          <p><strong>Total Amount:</strong> ₹${total.toFixed(2)}</p>
          <p><strong>Delivery Address:</strong></p>
          <p>${user.address.street || ''}</p>
          <p>${user.address.city || ''}, ${user.address.state || ''} ${user.address.pincode || ''}</p>
          <p><strong>Payment:</strong> Cash on Delivery</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Place Order',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await placeOrder(user.address, 'cod');
        Swal.fire({
          title: 'Order Placed!',
          text: 'Your order has been placed successfully',
          icon: 'success'
        });
      } catch (error) {
        console.error('Order placement error:', error);
        Swal.fire({
          title: 'Order Failed',
          text: error.response?.data?.message || 'Failed to place order',
          icon: 'error'
        });
      }
    }
  };
  
  if (cart.length === 0) {
    return (
      <CartContainer>
        <CartTitle>Cart</CartTitle>
        <EmptyCart>
          <i className="expDel_shopping_cart"></i>
          <h3>Cart is empty</h3>
          <p>Add some delicious groceries to get started!</p>
          <ContinueButton onClick={() => window.location.href = '/'}>
            Continue Shopping
          </ContinueButton>
        </EmptyCart>
      </CartContainer>
    );
  }
  
  const deliveryCharge = total > 500 ? 0 : 50;
  const grandTotal = total + deliveryCharge;
  
  return (
    <CartContainer>
      <CartTitle>Cart ({cart.length} items)</CartTitle>
      
      <CartContent>
        <CartItems>
          {cart.map(item => (
            <CartItem key={item._id}>
              <ItemImage 
                src={item.image && (item.image.startsWith('http') ? item.image : `${item.image.startsWith('/') ? '' : '/'}${item.image}`) || 'https://via.placeholder.com/100x100?text=No+Image'}
                alt={item.name}
              />
              
              <ItemDetails>
                <ItemName>{item.name}</ItemName>
                <ItemPrice><span className="currency">{item.price.toFixed(2)}</span> / {item.unit}</ItemPrice>
              </ItemDetails>
              
              <QuantityControl>
                <QuantityButton 
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                >
                  -
                </QuantityButton>
                <QuantityInput 
                  type="number" 
                  value={item.quantity}
                  min="1"
                  onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                />
                <QuantityButton 
                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                >
                  +
                </QuantityButton>
              </QuantityControl>
              
              <RemoveButton onClick={() => removeFromCart(item._id)}>
                <i className="expDel_trash"></i>
              </RemoveButton>
            </CartItem>
          ))}
        </CartItems>
        
        <CartSummary>
          <SummaryTitle>Order Summary</SummaryTitle>
          
          <SummaryRow>
            <span>Subtotal</span>
            <span className="currency">{total.toFixed(2)}</span>
          </SummaryRow>
          
          <SummaryRow>
            <span>Delivery Charges</span>
            <span className="currency">
              {deliveryCharge === 0 ? 'FREE' : `${deliveryCharge.toFixed(2)}`}
            </span>
          </SummaryRow>
          
          {deliveryCharge > 0 && (
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Add ₹{(500 - total).toFixed(2)} more for FREE delivery
            </p>
          )}
          
          <SummaryRow total>
            <span>Total</span>
            <span className="currency">{grandTotal.toFixed(2)}</span>
          </SummaryRow>
          
          <CheckoutButton onClick={handleCheckout}>
            Proceed to Checkout
          </CheckoutButton>
          
          <ContinueButton onClick={() => window.location.href = '/'}>
            Continue Shopping
          </ContinueButton>
        </CartSummary>
      </CartContent>
    </CartContainer>
  );
};

export default Cart;