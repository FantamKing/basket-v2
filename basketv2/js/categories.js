import { AppState } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    renderCategories();
});

function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container || !AppState.categories.length) return;
    
    let html = '';
    
    // Define icons for each category
    const categoryIcons = {
        1: 'fas fa-apple-alt',
        2: 'fas fa-cheese',
        3: 'fas fa-drumstick-bite',
        4: 'fas fa-utensils',
        5: 'fas fa-wine-bottle',
        6: 'fas fa-cookie-bite',
        7: 'fas fa-snowflake',
        8: 'fas fa-bread-slice',
        9: 'fas fa-heartbeat',
        10: 'fas fa-globe-americas',
        11: 'fas fa-baby',
        12: 'fas fa-paw'
    };
    
    // Define colors for each category
    const categoryColors = {
        1: '#2ecc71',
        2: '#3498db',
        3: '#e74c3c',
        4: '#f39c12',
        5: '#9b59b6',
        6: '#1abc9c',
        7: '#34495e',
        8: '#d35400',
        9: '#27ae60',
        10: '#8e44ad',
        11: '#e84393',
        12: '#00cec9'
    };
    
    AppState.categories.forEach(category => {
        html += `
            <div class="category-card" data-id="${category.id}">
                <div class="category-header">
                    <div class="category-icon" style="background-color: ${categoryColors[category.id] || '#2ecc71'}">
                        <i class="${categoryIcons[category.id] || 'fas fa-shopping-basket'}"></i>
                    </div>
                    <div class="category-title">
                        <h3>${category.name}</h3>
                        <p>${category.description}</p>
                    </div>
                    <div class="toggle-icon">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="category-content">
                    ${category.subcategories.map(sub => `
                        <div class="subcategory">
                            <h4>${sub.name}</h4>
                            <div class="subcategory-items">
                                ${sub.items.map(item => `
                                    <span class="subcategory-item">${item}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add click events to category cards
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.category-content')) {
                this.classList.toggle('active');
            }
        });
    });
}