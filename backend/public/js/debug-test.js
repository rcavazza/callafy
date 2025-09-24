// Script di debug per identificare il problema di inizializzazione
console.log('🔍 DEBUG: Script di debug caricato');

// Test 1: Verifica che il DOM sia pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DEBUG: DOM è pronto');
    
    // Test 2: Verifica che gli oggetti globali esistano
    console.log('🔍 DEBUG: window.router exists?', !!window.router);
    console.log('🔍 DEBUG: window.app exists?', !!window.app);
    console.log('🔍 DEBUG: window.api exists?', !!window.api);
    console.log('🔍 DEBUG: window.state exists?', !!window.state);
    
    // Test 3: Verifica che i link abbiano l'attributo data-route
    const links = document.querySelectorAll('[data-route]');
    console.log('🔍 DEBUG: Link con data-route trovati:', links.length);
    links.forEach((link, index) => {
        console.log(`🔍 DEBUG: Link ${index}:`, link.getAttribute('data-route'), link.textContent.trim());
    });
    
    // Test 4: Aggiungi event listener manuale per test
    links.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔍 DEBUG: Link cliccato manualmente:', link.getAttribute('data-route'));
            alert(`Link ${index} cliccato: ${link.getAttribute('data-route')}`);
        });
    });
    
    // Test 5: Verifica se il router ha event listener
    if (window.router) {
        console.log('🔍 DEBUG: Router routes:', window.router.getRoutes());
    }
});

// Test immediato
console.log('🔍 DEBUG: Script eseguito immediatamente');