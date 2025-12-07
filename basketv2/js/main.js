// Application State
const AppState = {
    currentPage: 'home',
    cart: [],
    categories: [],
    products: []
};

// Load components
async function loadComponent(id, url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${id}:`, error);
    }
}

// Load page
async function loadPage(page) {
    const response = await fetch(`pages/${page}.html`);
    const html = await response.text();
    document.getElementById('main-content').innerHTML = html;
    
    // Load page-specific CSS
    loadPageCSS(page);
    
    // Load page-specific JS
    loadPageJS(page);
    
    // Update active nav
    updateActiveNav(page);
    
    AppState.currentPage = page;
}

// Load page-specific CSS
function loadPageCSS(page) {
    // Remove existing page CSS
    const existingCSS = document.getElementById('page-css');
    if (existingCSS) {
        existingCSS.remove();
    }
    
    // Add new page CSS
    const link = document.createElement('link');
    link.id = 'page-css';
    link.rel = 'stylesheet';
    link.href = `css/${page}.css`;
    document.head.appendChild(link);
}

// Load page-specific JS
function loadPageJS(page) {
    // Remove existing page JS
    const existingJS = document.getElementById('page-js');
    if (existingJS) {
        existingJS.remove();
    }
    
    // Add new page JS
    const script = document.createElement('script');
    script.id = 'page-js';
    script.src = `js/${page}.js`;
    script.type = 'module';
    document.body.appendChild(script);
}

// Update active navigation
function updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// Initialize the application
async function initApp() {
    // Load header, footer, and modals
    await loadComponent('header', 'components/header.html');
    await loadComponent('footer', 'components/footer.html');
    await loadComponent('modals-container', 'components/modals.html');
    
    // Load initial page
    await loadPage('home');
    
    // Load data
    await loadData();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load cart from localStorage
    loadCart();
    updateCartCount();
}

// Load data
async function loadData() {
    // Load categories
    const categoriesResponse = await fetch('data/categories.json');
    AppState.categories = await categoriesResponse.json();
    
    // Load products
    const productsResponse = await fetch('data/products.json');
    AppState.products = await productsResponse.json();
}

// Initialize event listeners
function initEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            e.preventDefault();
            const page = e.target.dataset.page;
            loadPage(page);
        }
    });
    
    // Cart link
    document.addEventListener('click', (e) => {
        if (e.target.closest('#cart-link')) {
            e.preventDefault();
            loadPage('cart');
        }
    });
    
    // Mobile menu
    document.addEventListener('click', (e) => {
        if (e.target.closest('.mobile-menu-btn')) {
            document.querySelector('.main-nav').classList.toggle('active');
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Cart functions
function addToCart(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = AppState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        AppState.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showNotification(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    const itemIndex = AppState.cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        AppState.cart.splice(itemIndex, 1);
        saveCart();
        updateCartCount();
        showNotification('Item removed from cart');
    }
}

function updateQuantity(productId, change) {
    const item = AppState.cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartCount();
        }
    }
}

function saveCart() {
    localStorage.setItem('groceryCart', JSON.stringify(AppState.cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('groceryCart');
    if (savedCart) {
        AppState.cart = JSON.parse(savedCart);
    }
}

function updateCartCount() {
    const count = AppState.cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = count;
    }
}

function getCartTotal() {
    const subtotal = AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    return subtotal + 2.99; // Delivery fee
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: var(--primary);
        color: white;
        padding: 15px 20px;
        border-radius: var(--radius);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export for use in other modules
export { 
    AppState, 
    loadPage, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    showModal,
    closeAllModals,
    showNotification
};