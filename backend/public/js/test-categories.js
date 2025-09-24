// Test semplificato per Categories
console.log('🧪 Test Categories script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 DOM loaded - testing Categories');
    
    // Test basic functionality
    const addBtn = document.getElementById('add-category-btn');
    if (addBtn) {
        console.log('✅ Add button found');
        addBtn.addEventListener('click', () => {
            console.log('🧪 Add button clicked!');
            alert('Test: Add button works!');
        });
    } else {
        console.log('❌ Add button not found');
    }
    
    // Test API call
    if (window.api) {
        console.log('✅ API service available');
        window.api.getCategories()
            .then(response => {
                console.log('✅ API call successful:', response);
            })
            .catch(error => {
                console.log('❌ API call failed:', error);
            });
    } else {
        console.log('❌ API service not available');
    }
});