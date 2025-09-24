const express = require('express');
const router = express.Router();

// Test route - pagina bianca con console.log
router.get('/test', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>TEST JAVASCRIPT</title>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <style>
        body {
            background: #ff0000;
            color: white;
            font-family: Arial;
            padding: 50px;
            text-align: center;
        }
        h1 { font-size: 3em; }
    </style>
</head>
<body>
    <h1>🔥 PAGINA TEST JAVASCRIPT</h1>
    <p>Se vedi questa pagina ROSSA, il server funziona!</p>
    <button onclick="testClick()">CLICCA QUI</button>
    
    <script>
        console.log('🔥 JAVASCRIPT FUNZIONA!');
        alert('🔥 JAVASCRIPT ATTIVO!');
        
        function testClick() {
            console.log('🔥 BUTTON CLICKED!');
            alert('🔥 BUTTON WORKS!');
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔥 DOM READY!');
        });
    </script>
</body>
</html>
    `);
});

// Test route for VariantsManager
router.get('/test-variants', (req, res) => {
    res.render('pages/test-variants', {
        title: 'Test VariantsManager - Inventory Manager',
        page: 'test'
    });
});

// Dashboard redirect - now uses the main dashboard route
router.get('/dashboard-new', (req, res) => {
    res.redirect('/dashboard');
});

// Main application route - serves dashboard
router.get('/', (req, res) => {
  res.render('pages/dashboard', { 
    title: 'Dashboard',
    page: 'dashboard'
  });
});

// Dashboard page
router.get('/dashboard', (req, res) => {
  res.render('pages/dashboard', { 
    title: 'Dashboard',
    page: 'dashboard'
  });
});

// Categories page
router.get('/categories', (req, res) => {
  res.render('pages/categories', { 
    title: 'Categorie',
    page: 'categories'
  });
});

// Products redirect - clean URL
router.get('/products', (req, res) => {
  res.redirect('/products-new');
});

// Products page - using products-new as the main products page
router.get('/products-new', (req, res) => {
  res.render('pages/products-new', {
    title: 'Gestione Prodotti',
    page: 'products-new'
  });
});

// Product detail page
router.get('/products/:id', (req, res) => {
  res.render('pages/product-detail', {
    title: 'Dettaglio Prodotto',
    page: 'product-detail',
    productId: req.params.id
  });
});

// Images page
router.get('/images', (req, res) => {
  res.render('pages/images', { 
    title: 'Immagini',
    page: 'images'
  });
});

// Attributes page
router.get('/attributes', (req, res) => {
  res.render('pages/attributes', { 
    title: 'Attributi',
    page: 'attributes'
  });
});

// Shopify Export page
router.get('/shopify', (req, res) => {
  res.render('pages/shopify', {
    title: 'Export Shopify',
    page: 'shopify'
  });
});

// New Categories page - rebuilt from scratch with full functionality
router.get('/categories-new', (req, res) => {
  res.render('pages/categories-new', {
    title: 'Gestione Categorie',
    page: 'categories-new'
  });
});


// New Images page - rebuilt from scratch with full functionality
router.get('/images-new', (req, res) => {
  res.render('pages/images-new', {
    title: 'Gestione Immagini',
    page: 'images-new'
  });
});

// New Attributes page - rebuilt from scratch with full functionality
router.get('/attributes-new', (req, res) => {
  res.render('pages/attributes-new', {
    title: 'Gestione Attributi',
    page: 'attributes-new'
  });
});

// New Shopify Export page - complete export interface
router.get('/shopify-export', (req, res) => {
  res.render('pages/shopify-export', {
    title: 'Shopify Export',
    page: 'shopify-export'
  });
});

// Variants Manager page - advanced variants management wizard
router.get('/variants-manager', (req, res) => {
  res.render('pages/variants-manager', {
    title: 'Gestione Varianti Avanzata',
    page: 'variants-manager'
  });
});

module.exports = router;