/**
 * Categories Page - Simplified Version for Testing
 */

console.log('🏷️ Categories script loaded');

// Simple test class
class SimpleCategoriesPage {
    constructor() {
        this.initialized = false;
        console.log('🏷️ SimpleCategoriesPage constructor called');
    }

    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🏷️ Initializing simple categories page');
            
            // Setup basic event listeners
            this.setupEventListeners();
            
            // Test API call
            await this.testAPI();
            
            this.initialized = true;
            console.log('✅ Simple categories page initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing simple categories page:', error);
        }
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners');
        
        // Add category button
        const addBtn = document.getElementById('add-category-btn');
        if (addBtn) {
            console.log('✅ Add button found');
            addBtn.addEventListener('click', () => {
                console.log('🏷️ Add button clicked!');
                alert('Categories: Add button works!');
            });
        } else {
            console.log('❌ Add button not found');
        }
    }

    async testAPI() {
        console.log('🧪 Testing API');
        
        if (!window.api) {
            console.log('❌ API service not available');
            return;
        }
        
        try {
            console.log('📡 Making API call to get categories');
            const response = await window.api.getCategories();
            console.log('✅ API call successful:', response);
        } catch (error) {
            console.log('❌ API call failed:', error);
        }
    }
}

// Create global instance
console.log('🏷️ Creating global instance');
window.categoriesPage = new SimpleCategoriesPage();
window.simpleCategoriesPage = window.categoriesPage; // Backward compatibility

// Force initialization when page is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏷️ DOM loaded - checking if on categories page');
    if (window.location.pathname === '/categories') {
        console.log('🏷️ On categories page - initializing');
        window.categoriesPage.init();
    }
});

// Also initialize if already loaded
if (document.readyState === 'complete' && window.location.pathname === '/categories') {
    console.log('🏷️ Page already loaded - initializing');
    window.categoriesPage.init();
}

console.log('🏷️ Categories script setup complete');