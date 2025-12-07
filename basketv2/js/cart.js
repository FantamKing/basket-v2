import { AppState, removeFromCart, updateQuantity, loadPage, getCartTotal } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    setupEventListeners();
});

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (AppState.cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        container.innerHTML = '';
        updateSummary();
        return;
    }
    
    emptyCartMessage.style.display = 'none';
    
    let html = '';
    
    AppState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly data-id="${item.id}">
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-item" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateSummary();
    setupCartEventListeners();
}

function updateSummary() {
    const subtotal = AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
}

function setupEventListeners() {
    // Shop Now button in empty cart
    document.getElementById('shop-now-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        loadPage('store');
    });
    
    // Checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', function() {
        if (AppState.cart.length === 0) {
            alert('Your cart is empty. Add some items before checkout.');
            return;
        }
        
        alert(`Checkout functionality would be implemented in a real application.\n\nTotal: $${getCartTotal().toFixed(2)}`);
    });
}

function setupCartEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productId = parseInt(this.dataset.id);
            const action = this.dataset.action;
            
            if (action === 'increase') {
                updateQuantity(productId, 1);
            } else {
                updateQuantity(productId, -1);
            }
            
            renderCart();
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productId = parseInt(this.dataset.id);
            removeFromCart(productId);
            renderCart();
        });
    });
}