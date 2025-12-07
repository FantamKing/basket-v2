import { AppState, addToCart, updateQuantity } from './main.js';

let filteredProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    populateCategoryFilter();
    setupEventListeners();
});

function renderProducts(products = AppState.products) {
    filteredProducts = products;
    const container = document.getElementById('products-list');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    products.forEach(product => {
        const inCart = AppState.cart.find(item => item.id === product.id);
        const quantity = inCart ? inCart.quantity : 1;
        
        html += `
            <div class="product-card">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-content">
                    <h3>${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn" data-id="${product.id}" data-action="decrease">-</button>
                            <input type="text" class="quantity-input" value="${quantity}" readonly data-id="${product.id}">
                            <button class="quantity-btn" data-id="${product.id}" data-action="increase">+</button>
                        </div>
                        <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                            ${inCart ? '<i class="fas fa-check"></i> In Cart' : '<i class="fas fa-cart-plus"></i> Add'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners
    setupProductEventListeners();
}

function populateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    if (!filter) return;
    
    // Get unique categories from products
    const categories = [...new Set(AppState.products.map(p => p.category))];
    
    let options = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        options += `<option value="${category}">${category}</option>`;
    });
    
    filter.innerHTML = options;
}

function setupEventListeners() {
    // Category filter
    document.getElementById('category-filter')?.addEventListener('change', function(e) {
        filterProducts();
    });
    
    // Sort filter
    document.getElementById('sort-filter')?.addEventListener('change', function(e) {
        sortProducts(e.target.value);
    });
    
    // Search input (from header)
    document.getElementById('search-input')?.addEventListener('input', function(e) {
        filterProducts();
    });
}

function setupProductEventListeners() {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productId = parseInt(this.dataset.id);
            addToCart(productId);
            
            // Update button text
            this.innerHTML = '<i class="fas fa-check"></i> In Cart';
            this.classList.add('added');
        });
    });
    
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productId = parseInt(this.dataset.id);
            const action = this.dataset.action;
            
            if (action === 'increase') {
                updateQuantity(productId, 1);
                updateQuantityInput(productId);
            } else {
                updateQuantity(productId, -1);
                updateQuantityInput(productId);
            }
        });
    });
}

function updateQuantityInput(productId) {
    const input = document.querySelector(`.quantity-input[data-id="${productId}"]`);
    if (input) {
        const item = AppState.cart.find(item => item.id === productId);
        if (item) {
            input.value = item.quantity;
        } else {
            input.value = 1;
            // Reset add to cart button
            const btn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
            if (btn) {
                btn.innerHTML = '<i class="fas fa-cart-plus"></i> Add';
                btn.classList.remove('added');
            }
        }
    }
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    
    let filtered = AppState.products;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply current sort
    const sortFilter = document.getElementById('sort-filter')?.value || 'default';
    filtered = sortProductsArray(filtered, sortFilter);
    
    renderProducts(filtered);
}

function sortProducts(sortBy) {
    const sorted = sortProductsArray(filteredProducts, sortBy);
    renderProducts(sorted);
}

function sortProductsArray(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // Default sorting (by category)
            sorted.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }
    
    return sorted;
}