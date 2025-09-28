/**
 * Script di test per verificare la connessione Shopify e il debug
 * 
 * Questo script testa:
 * 1. Connessione alle API Shopify
 * 2. Mapping di un prodotto di esempio
 * 3. Validazione prodotto
 * 4. Debug dettagliato
 * 
 * Uso: node test-shopify-debug.js
 */

const ShopifyApiClient = require('./backend/services/shopifyApi');
const ShopifyMapper = require('./backend/services/shopifyMapper');

async function testShopifyDebug() {
  console.log('🧪 [TEST] Avvio test debug Shopify...\n');

  // Test 1: Connessione Shopify
  console.log('🔗 [TEST] Test 1: Connessione Shopify');
  const shopifyClient = new ShopifyApiClient();
  
  const connectionResult = await shopifyClient.testConnection();
  console.log('Risultato connessione:', connectionResult);
  console.log();

  // Test 2: Mapping prodotto di esempio
  console.log('📦 [TEST] Test 2: Mapping prodotto di esempio');
  
  const mockProduct = {
    id: 999,
    title: 'Prodotto Test Debug',
    description: 'Descrizione del prodotto di test',
    vendor: 'Test Vendor',
    product_type: 'Test Type',
    tags: 'test,debug',
    handle: 'prodotto-test-debug',
    status: 'active',
    variants: [
      {
        id: 1,
        price: 29.99,
        compare_at_price: 39.99,
        sku: 'TEST-001',
        inventory_quantity: 10,
        option1: 'Default'
      }
    ],
    options: [
      {
        name: 'Title',
        position: 1,
        values: ['Default']
      }
    ],
    images: [
      {
        id: 1,
        src: '/uploads/test-image.jpg',
        alt_text: 'Test image',
        position: 1,
        variant_id: 1
      }
    ],
    attributes: [
      {
        key: 'material',
        value: 'cotton',
        value_type: 'string'
      }
    ]
  };

  try {
    // Test validazione
    console.log('🔍 [TEST] Validazione prodotto...');
    const validation = ShopifyMapper.validateProductForShopify(mockProduct);
    console.log('Risultato validazione:', validation);
    console.log();

    // Test mapping
    console.log('🔄 [TEST] Mapping prodotto...');
    const mappedProduct = ShopifyMapper.mapProductToShopify(mockProduct);
    console.log('Prodotto mappato:', JSON.stringify(mappedProduct, null, 2));
    console.log();

    // Test preparazione immagini
    console.log('🖼️ [TEST] Preparazione immagini...');
    const imagesData = ShopifyMapper.prepareImagesForUpload(mockProduct.images, mockProduct.variants);
    console.log('Immagini preparate:', imagesData);
    console.log();

  } catch (error) {
    console.error('❌ [TEST] Errore durante i test:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('🏁 [TEST] Test debug completato!');
  console.log();
  console.log('💡 [INFO] Per testare con dati reali:');
  console.log('1. Configura le credenziali Shopify nel file .env');
  console.log('2. Usa l\'endpoint: GET /api/shopify/test per testare la connessione');
  console.log('3. Usa l\'endpoint: POST /api/shopify/export/:productId per l\'export');
  console.log('4. Controlla i log del server per il debug dettagliato');
}

// Esegui il test se lo script viene chiamato direttamente
if (require.main === module) {
  testShopifyDebug().catch(console.error);
}

module.exports = { testShopifyDebug };