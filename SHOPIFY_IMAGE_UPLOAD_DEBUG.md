# Shopify Image Upload - Debug e Implementazione

## Panoramica

Questo documento descrive l'implementazione del sistema di upload diretto delle immagini su Shopify, che risolve il problema delle immagini non visibili durante l'export.

## Problema Risolto

**Problema originale**: Le immagini non apparivano su Shopify dopo l'export perché il sistema utilizzava URL localhost non accessibili da Shopify.

**Soluzione implementata**: Upload diretto delle immagini sui server di Shopify durante il processo di export, mantenendo il collegamento corretto con le varianti.

## Architettura della Soluzione

### 1. ShopifyApiClient - Nuove Funzioni

#### `uploadImageToProduct(productId, imagePath, imageData)`
- **Scopo**: Carica una singola immagine su Shopify
- **Input**: 
  - `productId`: ID del prodotto Shopify
  - `imagePath`: Percorso locale del file immagine
  - `imageData`: Metadati (alt_text, position, variant_ids)
- **Output**: Risposta Shopify con dettagli dell'immagine caricata
- **Debug**: Log dettagliati per ogni fase dell'upload

#### `uploadMultipleImagesToProduct(productId, imagesData)`
- **Scopo**: Carica multiple immagini in batch
- **Gestione errori**: Continua l'upload anche se alcune immagini falliscono
- **Rate limiting**: Pausa di 500ms tra upload per evitare limiti API

### 2. ShopifyMapper - Nuove Funzioni

#### `prepareImagesForUpload(images, variants)`
- **Scopo**: Prepara i dati delle immagini per l'upload
- **Mapping varianti**: Converte ID locali in ID Shopify
- **Validazione**: Verifica esistenza file e correttezza dati
- **Debug**: Log dettagliati per ogni immagine processata

#### `getLocalImagePath(src)`
- **Scopo**: Risolve il percorso locale del file immagine
- **Gestione percorsi**: Supporta percorsi relativi e assoluti

### 3. Route Handler - Processo Modificato

#### Export Prodotto Completo (`POST /api/shopify/export/:productId`)
Il processo di export ora segue questi passaggi:

1. **Creazione/Aggiornamento Prodotto** (senza immagini)
2. **Aggiornamento Varianti** con ID Shopify
3. **Upload Immagini** con collegamento alle varianti corrette
4. **Risposta Completa** con statistiche dettagliate

#### Export Singola Variante (`POST /api/shopify/export-variant/:variantId`)
Il processo di export di singola variante ora include:

1. **Verifica Prodotto Padre** (deve essere già esportato su Shopify)
2. **Creazione/Aggiornamento Variante** su Shopify
3. **Aggiornamento ID Shopify** della variante locale
4. **Upload Immagini Specifiche** (solo quelle collegate a questa variante)
5. **Risposta Completa** con statistiche dettagliate

## Debug e Logging

### Prefissi Log per Identificazione

- `🖼️ [IMAGE_UPLOAD]`: Upload singola immagine
- `🖼️ [MULTI_IMAGE_UPLOAD]`: Upload multiple immagini
- `🖼️ [PREPARE_IMAGES]`: Preparazione dati immagini
- `🔗 [PREPARE_IMAGES]`: Mapping varianti
- `🔍 [PREVIEW]`: Anteprima export
- `🔄 [EXPORT]`: Processo export generale
- `🖼️ [VARIANT_EXPORT]`: Upload immagini per singola variante

### Informazioni Tracciate

1. **Dimensione e tipo file** per ogni immagine
2. **Mapping varianti** (ID locale → ID Shopify)
3. **Risultati upload** (successo/errore per ogni immagine)
4. **Collegamento varianti** (quali immagini sono collegate a quali varianti)
5. **Statistiche finali** (totale, successi, errori)

## Collegamento Immagini-Varianti

### Come Funziona

1. **Database locale**: Ogni immagine ha un `variant_id` che la collega a una variante specifica
2. **Mapping ID**: Durante l'export, l'ID locale della variante viene convertito nell'ID Shopify
3. **Upload con collegamento**: L'immagine viene caricata su Shopify con il campo `variant_ids` popolato
4. **Verifica**: I log mostrano il collegamento effettuato

### Esempio di Log

#### Export Prodotto Completo
```
🖼️ [PREPARE_IMAGES] Processing image 1/3: /uploads/product-image.jpg
🔗 [PREPARE_IMAGES] Image linked to variant: local_id=123 -> shopify_id=456789
🖼️ [IMAGE_UPLOAD] Linking image to variants: 456789
✅ [IMAGE_UPLOAD] Successfully uploaded image to Shopify - Image ID: 987654321
🔗 [IMAGE_UPLOAD] Image linked to variants: 456789
```

#### Export Singola Variante
```
🖼️ [VARIANT_EXPORT] Checking images for variant 123
🖼️ [VARIANT_EXPORT] Found 2 images for variant 123
🖼️ [PREPARE_IMAGES] Processing image 1/2: /uploads/variant-image.jpg
🔗 [PREPARE_IMAGES] Image linked to variant: local_id=123 -> shopify_id=456789
🖼️ [IMAGE_UPLOAD] Linking image to variants: 456789
✅ [IMAGE_UPLOAD] Successfully uploaded image to Shopify - Image ID: 987654321
📊 [VARIANT_EXPORT] Image upload completed - Success: 2, Failed: 0
```

## API Response Migliorata

La risposta dell'export ora include:

```json
{
  "success": true,
  "data": {
    "product_id": 123,
    "shopify_id": 456789,
    "images_count": 3,
    "images_failed": 0,
    "image_upload_summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  },
  "warnings": []
}
```

## Preview Migliorata

La funzione di preview ora mostra:

- **Analisi immagini**: Quante immagini possono essere caricate
- **Dettagli file**: Esistenza file, nome, posizione
- **Mapping varianti**: A quali varianti sono collegate le immagini
- **Validazione**: Problemi potenziali prima dell'export

## Gestione Errori

### Errori Non Bloccanti

- **Immagine singola fallisce**: L'export continua con le altre immagini
- **File non trovato**: Viene loggato ma non blocca l'export del prodotto
- **Errore di rete**: Retry automatico per errori temporanei

### Errori Bloccanti

- **Prodotto non creato**: Se il prodotto non può essere creato su Shopify
- **Configurazione mancante**: Se le credenziali Shopify non sono configurate

## Testing e Verifica

### Come Verificare il Funzionamento

1. **Controllare i log**: Cercare i prefissi `🖼️` e `🔗` per tracciare l'upload
2. **Verificare su Shopify**: Le immagini dovrebbero apparire nel prodotto
3. **Controllare collegamento varianti**: Le immagini dovrebbero essere associate alle varianti corrette
4. **Testare la preview**: Usare `/api/shopify/preview/:productId` per vedere l'analisi pre-export

### Comandi di Test

```bash
# Test connessione Shopify
curl http://localhost:3001/api/shopify/test

# Preview export con analisi immagini
curl http://localhost:3001/api/shopify/preview/123

# Export prodotto completo con debug completo
curl -X POST http://localhost:3001/api/shopify/export/123

# Export singola variante con debug completo
curl -X POST http://localhost:3001/api/shopify/export-variant/456

# Export forzato (aggiorna se già esiste)
curl -X POST http://localhost:3001/api/shopify/export/123 \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Export variante forzato
curl -X POST http://localhost:3001/api/shopify/export-variant/456 \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

## Risoluzione Problemi

### Immagini Non Caricate

1. **Verificare esistenza file**: Controllare che i file esistano in `backend/uploads/`
2. **Controllare permessi**: Assicurarsi che l'applicazione possa leggere i file
3. **Verificare log**: Cercare errori nei log con prefisso `❌ [IMAGE_UPLOAD]`

### Collegamento Varianti Errato

1. **Verificare mapping**: Controllare i log `🔗 [PREPARE_IMAGES]`
2. **Verificare ID Shopify**: Assicurarsi che le varianti abbiano `shopify_id` popolato
3. **Controllare database**: Verificare che `images.variant_id` sia corretto

### Performance

- **Upload sequenziale**: Le immagini vengono caricate una alla volta per evitare rate limiting
- **Pausa tra upload**: 500ms di pausa tra ogni upload
- **Gestione timeout**: Timeout di 30 secondi per ogni upload

## Backward Compatibility

- **Funzione deprecata**: `mapImagesToShopify()` è ancora disponibile ma deprecata
- **Fallback**: Se l'upload fallisce, il prodotto viene comunque esportato
- **Configurazione**: Nessuna configurazione aggiuntiva richiesta