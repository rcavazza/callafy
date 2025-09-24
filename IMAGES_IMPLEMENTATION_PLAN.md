# Piano di Implementazione Sistema Images

## Analisi Architettura Esistente

### ✅ Backend Completamente Implementato
- **Modello Image**: Completo con relazioni Product/Variant
- **API CRUD**: Tutte le operazioni implementate (`/api/images`)
- **Middleware Upload**: Multer configurato per singolo/multiplo
- **Validazione**: Joi schema per validazione dati
- **File Storage**: Directory `/uploads` configurata
- **Static Serving**: Express serve file da `/uploads`

### ❌ Elementi Mancanti
- **Rotte Upload**: `/api/images/upload` e `/api/images/upload-multiple`
- **Frontend**: Pagina Images completa
- **UI Upload**: Drag & Drop interface
- **Preview**: Anteprima immagini caricate
- **Gestione**: Associazione con Products/Variants

## Architettura Sistema Images

### Modello Dati
```javascript
Image {
  id: INTEGER (PK)
  product_id: INTEGER (FK -> products.id) *required
  variant_id: INTEGER (FK -> variants.id) *optional
  src: STRING (URL/path immagine) *required
  alt_text: STRING (testo alternativo)
  position: INTEGER (ordine visualizzazione)
  width: INTEGER (larghezza pixel)
  height: INTEGER (altezza pixel)  
  size: INTEGER (dimensione file bytes)
  filename: STRING (nome file originale)
  timestamps: createdAt, updatedAt
}
```

### Relazioni
- **Image belongsTo Product** (product_id)
- **Image belongsTo Variant** (variant_id, optional)
- **Product hasMany Images**
- **Variant hasMany Images**

### API Endpoints Esistenti
- `GET /api/images` - Lista immagini con filtri
- `GET /api/images/:id` - Singola immagine
- `POST /api/images` - Crea immagine (metadata)
- `PUT /api/images/:id` - Aggiorna immagine
- `DELETE /api/images/:id` - Elimina immagine
- `PUT /api/images/:id/position` - Aggiorna posizione

### API Endpoints da Aggiungere
- `POST /api/images/upload` - Upload singola immagine
- `POST /api/images/upload-multiple` - Upload multiple immagini

## Piano di Implementazione

### FASE 1: Completare Backend Upload

#### 1.1 Aggiungere Rotte Upload
```javascript
// POST /api/images/upload - Upload singola immagine
router.post('/upload', uploadSingle('image'), async (req, res) => {
  // 1. Validare file caricato
  // 2. Creare record Image nel database
  // 3. Restituire dati immagine + URL
});

// POST /api/images/upload-multiple - Upload multiple immagini  
router.post('/upload-multiple', uploadMultiple('images', 10), async (req, res) => {
  // 1. Validare files caricati
  // 2. Creare records Image nel database
  // 3. Restituire array immagini + URLs
});
```

#### 1.2 Gestione Metadati
- Estrarre dimensioni immagine (width/height)
- Salvare informazioni file (size, filename, mimetype)
- Generare URL pubblico per accesso

#### 1.3 Validazione e Sicurezza
- Controllo tipi file (jpeg, jpg, png, gif, webp)
- Limite dimensione file (5MB)
- Limite numero file (10 per upload multiplo)
- Sanitizzazione nomi file

### FASE 2: Implementare Frontend Images

#### 2.1 Pagina Images (`/images-new`)
```
Header: "🖼️ Gestione Immagini"
├── Controls
│   ├── Search: "Cerca immagini..."
│   ├── Filter Product: Dropdown prodotti
│   ├── Filter Variant: Dropdown varianti
│   └── Button: "📤 Carica Immagini"
├── Upload Area (Drag & Drop)
│   ├── Drop Zone: "Trascina immagini qui o clicca per selezionare"
│   ├── File Input: Multiple selection
│   ├── Preview: Thumbnails immagini selezionate
│   └── Upload Progress: Barra progresso
└── Images Grid
    ├── Image Cards: Thumbnail + metadata
    ├── Actions: Modifica, Elimina, Riordina
    └── Pagination: Navigazione pagine
```

#### 2.2 Componenti UI

**Upload Zone**
- Drag & Drop area responsive
- Visual feedback per drag over
- Preview thumbnails immagini selezionate
- Progress bar durante upload
- Gestione errori upload

**Image Card**
```
┌─────────────────────┐
│     [Thumbnail]     │
│                     │
├─────────────────────┤
│ filename.jpg        │
│ 1920x1080 • 2.3MB  │
│ Product: iPhone 15  │
│ Variant: Blue 128GB │
├─────────────────────┤
│ [Edit] [Delete] [↕] │
└─────────────────────┘
```

**Modal Modifica Immagine**
- Preview immagine grande
- Form: alt_text, position, product_id, variant_id
- Associazione con prodotti/varianti
- Salvataggio modifiche

#### 2.3 Funzionalità Avanzate

**Drag & Drop Upload**
- Supporto trascinamento file
- Preview immediato immagini
- Upload batch con progress
- Gestione errori per file

**Gestione Associazioni**
- Dropdown prodotti dinamico
- Dropdown varianti filtrate per prodotto
- Associazione multipla durante upload
- Modifica associazioni esistenti

**Riordinamento**
- Drag & Drop per riordinare
- Aggiornamento posizioni via API
- Visual feedback durante riordino

### FASE 3: Integrazione con Products

#### 3.1 Aggiornare Pagina Products
- Sezione immagini nel modal prodotto
- Upload immagini durante creazione
- Gallery immagini nella lista prodotti
- Gestione immagine principale

#### 3.2 Workflow Integrato
1. **Creazione Prodotto**: Upload immagini contestuale
2. **Modifica Prodotto**: Gestione gallery esistente
3. **Varianti**: Associazione immagini specifiche
4. **Preview**: Anteprima immagini in tabella

## Specifiche Tecniche

### Frontend Architecture
```
pages/images-new.ejs
├── HTML Structure
│   ├── Header + Navigation
│   ├── Upload Zone (Drag & Drop)
│   ├── Images Grid (Cards)
│   └── Modals (Edit, Preview)
├── CSS Styling
│   ├── Drag & Drop styles
│   ├── Grid layout responsive
│   ├── Card components
│   └── Upload progress
└── JavaScript Logic
    ├── Drag & Drop handlers
    ├── File upload management
    ├── API integration
    └── UI state management
```

### API Integration
```javascript
// Upload singola immagine
const uploadImage = async (file, metadata) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('product_id', metadata.product_id);
  formData.append('variant_id', metadata.variant_id);
  formData.append('alt_text', metadata.alt_text);
  
  return await api.uploadImage(formData);
};

// Upload multiple immagini
const uploadMultipleImages = async (files, metadata) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  formData.append('product_id', metadata.product_id);
  
  return await api.uploadMultipleImages(formData);
};
```

### File Management
- **Storage**: `/backend/uploads/` directory
- **Naming**: `timestamp-random-originalname.ext`
- **Access**: `http://localhost:3001/uploads/filename.jpg`
- **Cleanup**: Eliminazione file orfani

### Performance Considerations
- **Lazy Loading**: Caricamento immagini on-demand
- **Thumbnails**: Generazione thumbnails per preview
- **Caching**: Cache browser per immagini statiche
- **Compression**: Ottimizzazione dimensioni file

## User Experience

### Upload Flow
1. **Selezione**: Drag & Drop o click per selezionare
2. **Preview**: Anteprima immediata immagini selezionate
3. **Metadata**: Form per associazione prodotto/variante
4. **Upload**: Progress bar e feedback visivo
5. **Conferma**: Notifica successo + aggiornamento grid

### Management Flow
1. **Visualizzazione**: Grid responsive con thumbnails
2. **Ricerca**: Filtro per prodotto/variante/nome
3. **Modifica**: Modal per aggiornare metadati
4. **Riordino**: Drag & Drop per cambiare posizione
5. **Eliminazione**: Conferma prima di eliminare

### Error Handling
- **File troppo grande**: "File troppo grande (max 5MB)"
- **Formato non supportato**: "Formato non supportato (solo jpg, png, gif, webp)"
- **Upload fallito**: "Errore durante upload, riprova"
- **Connessione**: "Errore di connessione al server"

## Testing Strategy

### Unit Tests
- Upload middleware validation
- File type checking
- Size limits enforcement
- Database operations

### Integration Tests
- API endpoints upload
- File storage operations
- Image metadata extraction
- Error handling scenarios

### UI Tests
- Drag & Drop functionality
- File selection interface
- Upload progress display
- Grid rendering and pagination

## Security Considerations

### File Validation
- Whitelist tipi MIME consentiti
- Controllo estensioni file
- Validazione header file
- Limite dimensioni rigoroso

### Storage Security
- Directory uploads fuori webroot
- Nomi file sanitizzati
- Accesso controllato via Express
- Cleanup file temporanei

### Input Sanitization
- Validazione metadati immagine
- Escape output HTML
- Protezione XSS
- Validazione associazioni prodotto/variante

## Deliverables

### Backend
- [ ] Rotte upload `/api/images/upload` e `/api/images/upload-multiple`
- [ ] Middleware gestione metadati immagine
- [ ] Validazione e error handling completi
- [ ] Test API endpoints

### Frontend  
- [ ] Pagina `/images-new` completa
- [ ] Drag & Drop upload interface
- [ ] Grid immagini responsive
- [ ] Modal modifica immagine
- [ ] Integrazione con pagina Products

### Documentation
- [ ] API documentation aggiornata
- [ ] User guide per gestione immagini
- [ ] Technical specs implementazione
- [ ] Testing procedures

## Timeline Stimato

- **Backend Upload Routes**: 2-3 ore
- **Frontend Images Page**: 4-5 ore  
- **Drag & Drop Interface**: 2-3 ore
- **Integration & Testing**: 2-3 ore
- **Documentation**: 1 ora

**Totale**: ~12-15 ore di sviluppo

## Success Criteria

✅ **Funzionalità Core**
- Upload singolo e multiplo funzionante
- Drag & Drop interface intuitiva
- Gestione metadati completa
- Associazione prodotti/varianti

✅ **User Experience**
- Interface responsive e moderna
- Feedback visivo durante operazioni
- Gestione errori user-friendly
- Performance ottimali

✅ **Technical Quality**
- Codice pulito e manutenibile
- Error handling robusto
- Security best practices
- Test coverage adeguato