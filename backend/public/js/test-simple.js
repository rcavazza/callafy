// Test script molto semplice
console.log('🧪 TEST SCRIPT LOADED!');
alert('JavaScript funziona!');

// Test click handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 DOM LOADED - Adding test click handler');
    
    const btn = document.getElementById('add-category-btn');
    if (btn) {
        console.log('🧪 Button found!');
        btn.addEventListener('click', () => {
            console.log('🧪 BUTTON CLICKED!');
            alert('BUTTON WORKS!');
        });
    } else {
        console.log('🧪 Button NOT found');
    }
});