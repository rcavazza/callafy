# Piano Implementazione Pagina Products

## 🎯 OBIETTIVO
Creare una pagina Products completa e funzionale seguendo il pattern di successo della pagina Categories, con gestione di varianti, opzioni e immagini.

## 📊 ANALISI BACKEND COMPLETATA

### Modelli e Relazioni
1. **Product** (Prodotto principale)
   - `id`, `title` (required), `description`, `vendor`, `product_type`
   - `tags` (comma-separated), `handle` (auto-generated), `status` (active/archived/draft)
   - `shopify_id`, `category_id` (FK verso Categories)

2. **Variant** (Varianti del prodotto)
   - `product_id` (FK), `sku`, `price` (required), `compare_at_price`
   - `option1`, `option2`, `option3` (3 opzioni max Shopify)
   - `barcode`, `inventory_quantity`, `inventory_management`
   - `weight`, `weight_unit`, `shopify_id`

3. **Option** (Opzioni per varianti)
   - `product_id` (FK), `name`, `position` (1-3)
   - `values` (JSON array di valori possibili)

4. **Image** (Immagini prodotto/variante)
   - `product_id` (FK), `variant_id` (FK opzionale)
   - `src`, `alt_text`, `position`, `width`, `height`

### API Endpoints Disponibili
- ✅ `GET /api/products` (lista con paginazione, filtri per status, category_id, search)
- ✅ `GET /api/products/:id` (dettaglio completo con tutte le relazioni)
- ✅ `POST /api/products` (creazione con validazione Joi)
- ✅ `PUT /api/products/:id` (aggiornamento)
- ✅ `DELETE /api/products/:id` (eliminazione)
- ✅ `POST /api/products/:id/variants` (aggiungi variante)
- ✅ `PUT/DELETE /api/products/:productId/variants/:variantId` (gestione varianti)

## 🎨 DESIGN INTERFACCIA PRODUCTS

### Layout Principale
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Gestione Prodotti                    [← Dashboard]       │
├─────────────────────────────────────────────────────────────┤
│ [Cerca prodotti...] [Tutti gli stati ▼] [Categoria ▼]      │
│                                          [➕ Nuovo Prodotto] │
├─────────────────────────────────────────────────────────────┤
│ TITOLO    │ CATEGORIA │ VARIANTI │ STATO │ PREZZO │ AZIONI  │
│ Smartphone│ Electronics│    3     │ Attivo│ €999   │ ✏️ 🗑️   │
│ T-Shirt   │ Clothing   │    6     │ Draft │ €25    │ ✏️ 🗑️   │
├─────────────────────────────────────────────────────────────┤
│           [← Precedente] Pagina 1 di 3 [Successivo →]      │
└─────────────────────────────────────────────────────────────┘
```

### Modal Nuovo/Modifica Prodotto
```
┌─────────────────────────────────────────────────────────────┐
│ Nuovo Prodotto                                         [×]  │
├─────────────────────────────────────────────────────────────┤
│ Titolo *: [_________________________]                      │
│ Descrizione: [________________________]                    │
│              [________________________]                    │
│ Vendor: [_________________________]                        │
│ Tipo Prodotto: [_________________________]                 │
│ Tags: [_________________________]                          │
│ Categoria: [Seleziona categoria ▼]                         │
│ Stato: [Draft ▼]                                           │
│                                                             │
│ ┌─── Varianti ──────────────────────────────────────────┐  │
│ │ [➕ Aggiungi Variante]                                │  │
│ │                                                       │  │
│ │ Variante 1: Default                                   │  │
│ │ SKU: [_______] Prezzo: [_______] Inventario: [____]  │  │
│ │ [✏️ Modifica] [🗑️ Elimina]                            │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─── Opzioni Prodotto ──────────────────────────────────┐  │
│ │ [➕ Aggiungi Opzione]                                 │  │
│ │                                                       │  │
│ │ Colore: Rosso, Blu, Verde                            │  │
│ │ Taglia: S, M, L, XL                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│                              [Annulla] [Salva Prodotto]    │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 FUNZIONALITÀ RICHIESTE

### 1. Lista Prodotti
- ✅ Caricamento dati da `/api/products`
- ✅ Paginazione (10 prodotti per pagina)
- ✅ Ricerca per titolo, descrizione, vendor
- ✅ Filtro per stato (active, archived, draft)
- ✅ Filtro per categoria
- ✅ Ordinamento per data aggiornamento (più recenti primi)
- ✅ Visualizzazione: titolo, categoria, numero varianti, stato, prezzo min

### 2. CRUD Prodotti
- ✅ **Create**: Modal con form completo + validazione
- ✅ **Read**: Caricamento dettagli prodotto con tutte le relazioni
- ✅ **Update**: Modifica prodotto esistente
- ✅ **Delete**: Eliminazione con conferma

### 3. Gestione Varianti
- ✅ Visualizzazione varianti esistenti
- ✅ Aggiunta nuove varianti
- ✅ Modifica varianti esistenti
- ✅ Eliminazione varianti
- ✅ Campi: SKU, prezzo, prezzo confronto, inventario, peso

### 4. Gestione Opzioni
- ✅ Massimo 3 opzioni per prodotto (limite Shopify)
- ✅ Ogni opzione ha nome e array di valori
- ✅ Generazione automatica combinazioni varianti
- ✅ Esempi: Colore (Rosso, Blu), Taglia (S, M, L)

### 5. Associazione Categorie
- ✅ Dropdown con tutte le categorie attive
- ✅ Visualizzazione categoria associata
- ✅ Possibilità di cambiare categoria

## 📝 STRUTTURA FILE DA CREARE

### 1. Template EJS
```
backend/views/pages/products-new.ejs
```
- Layout completo con header, controlli, tabella
- Modal per nuovo/modifica prodotto
- Modal per gestione varianti
- Modal per gestione opzioni
- Sistema notifiche
- Stili CSS inline (come Categories)

### 2. Rotta View
```javascript
// In backend/routes/views.js
router.get('/products-new', (req, res) => {
  res.render('pages/products-new', { 
    title: 'Gestione Prodotti',
    page: 'products-new'
  });
});
```

### 3. Aggiornamento Link Dashboard
```javascript
// In backend/routes/views.js - funzione navigateToProducts()
window.location.href = '/products-new';
```

## 🎯 FLUSSO UTENTE PRINCIPALE

### Scenario 1: Creazione Prodotto Semplice
1. Click "Nuovo Prodotto"
2. Compila: Titolo, Descrizione, Categoria, Stato
3. Sistema crea automaticamente variante default
4. Salva → Prodotto creato con 1 variante

### Scenario 2: Prodotto con Varianti
1. Crea prodotto base
2. Aggiungi opzioni (es. Colore: Rosso, Blu)
3. Aggiungi opzioni (es. Taglia: S, M, L)
4. Sistema genera 6 varianti automaticamente
5. Utente modifica prezzi/SKU per ogni variante

### Scenario 3: Gestione Inventario
1. Apri prodotto esistente
2. Visualizza tutte le varianti
3. Modifica quantità inventario per variante
4. Aggiorna prezzi se necessario

## 🔄 INTEGRAZIONE CON SISTEMA ESISTENTE

### API Calls JavaScript
```javascript
// Caricamento prodotti
const products = await api.getProducts({ page, limit, status, category_id, search });

// Caricamento categorie per dropdown
const categories = await api.getCategories();

// Creazione prodotto
const product = await api.createProduct(productData);

// Gestione varianti
const variant = await api.createVariant(productId, variantData);
```

### Gestione Stato
- Lista prodotti in memoria
- Prodotto corrente in modifica
- Lista categorie per dropdown
- Stato paginazione
- Filtri attivi

## 🎨 COMPONENTI UI RIUTILIZZABILI

### 1. Tabella Prodotti
- Header con ordinamento
- Righe con dati formattati
- Azioni per riga (Modifica, Elimina)
- Loading state

### 2. Form Prodotto
- Validazione client-side
- Campi obbligatori marcati
- Dropdown categorie dinamico
- Gestione errori

### 3. Gestione Varianti
- Lista varianti esistenti
- Form aggiunta variante
- Calcolo prezzo min/max
- Validazione SKU unici

### 4. Sistema Notifiche
- Success: "Prodotto creato con successo"
- Error: "Errore nella creazione del prodotto"
- Warning: "SKU già esistente"

## 🚀 PRIORITÀ IMPLEMENTAZIONE

### Fase 1: Base (MVP)
1. ✅ Pagina lista prodotti
2. ✅ Modal nuovo prodotto (campi base)
3. ✅ CRUD prodotti semplici
4. ✅ Associazione categorie

### Fase 2: Varianti
1. ✅ Visualizzazione varianti esistenti
2. ✅ Aggiunta/modifica varianti
3. ✅ Gestione inventario

### Fase 3: Opzioni Avanzate
1. ✅ Gestione opzioni prodotto
2. ✅ Generazione automatica varianti
3. ✅ Validazioni avanzate

## 📊 METRICHE DI SUCCESSO

### Funzionalità
- ✅ Caricamento lista prodotti < 2s
- ✅ Modal apertura < 500ms
- ✅ Salvataggio prodotto < 3s
- ✅ Ricerca real-time funzionante

### UX
- ✅ Interfaccia intuitiva
- ✅ Feedback immediato azioni
- ✅ Gestione errori chiara
- ✅ Responsive design

### Integrazione
- ✅ API calls funzionanti
- ✅ Validazione dati corretta
- ✅ Relazioni categorie OK
- ✅ Preparazione export Shopify

## 🔗 COLLEGAMENTI FUTURI

### Con Images (Fase 3)
- Upload immagini prodotto
- Associazione immagini varianti
- Galleria immagini

### Con Attributes (Fase 4)
- Campi personalizzati per categoria
- Metafields Shopify
- Attributi dinamici

### Con Shopify Export (Fase 5)
- Preview dati export
- Mapping campi Shopify
- Sincronizzazione bidirezionale

---

## ✅ CHECKLIST IMPLEMENTAZIONE

- [ ] Creare template `products-new.ejs`
- [ ] Aggiungere rotta `/products-new`
- [ ] Aggiornare link dashboard
- [ ] Testare caricamento lista prodotti
- [ ] Testare modal nuovo prodotto
- [ ] Testare CRUD completo
- [ ] Testare gestione varianti
- [ ] Testare filtri e ricerca
- [ ] Testare responsive design
- [ ] Validare integrazione API

**PRONTO PER IMPLEMENTAZIONE** 🚀