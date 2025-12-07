import { loadPage } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    // Shop Now button
    document.getElementById('shop-now-btn')?.addEventListener('click', () => {
        loadPage('categories');
    });
});