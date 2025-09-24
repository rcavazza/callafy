# Shopify Inventory Management System

Un'applicazione completa per la gestione dell'inventario con integrazione Shopify, sviluppata con Node.js/Express backend e frontend EJS.

## 🚀 Funzionalità Principali

- **Gestione Categorie Dinamiche**: Crea categorie personalizzabili con campi dinamici
- **Gestione Prodotti Completa**: CRUD prodotti con varianti, opzioni e attributi
- **Upload Immagini**: Sistema di upload multiplo con validazione
- **Integrazione Shopify**: Export automatico e sincronizzazione bidirezionale
- **Attributi Dinamici**: Metafields personalizzati per prodotti e varianti
- **API REST Complete**: Oltre 50 endpoint per tutte le operazioni

## 🏗️ Architettura

```
inventario2/
├── backend/                 # Node.js + Express API Server
│   ├── config/             # Configurazioni (database, logger)
│   ├── models/             # Modelli Sequelize
│   ├── routes/             # API endpoints
│   ├── middleware/         # Middleware personalizzati
│   ├── services/           # Servizi (Shopify integration)
│   ├── uploads/            # File immagini caricate
│   └── logs/               # File di log
├── shared/                 # Tipi e utilities condivise
├── API_DOCUMENTATION.md    # Documentazione API completa
└── development-plan.md     # Piano di sviluppo dettagliato
```

## 🛠️ Stack Tecnologico

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite con Sequelize ORM
- **Upload**: Multer per gestione file
- **Validazione**: Joi
- **Logging**: Winston
- **API Client**: Axios (per Shopify)

### Frontend
- **Template Engine**: EJS
- **Styling**: Tailwind CSS
- **JavaScript**: Vanilla JS con architettura modulare
- **HTTP Client**: Fetch API
- **State Management**: Custom state manager

## 📊 Schema Database

### Tabelle Principali
- **categories**: Categorie prodotti con tipi Shopify
- **category_fields**: Campi dinamici per categorie
- **products**: Prodotti con metadati e handle
- **variants**: Varianti prodotto con prezzi e inventario
- **options**: Opzioni prodotto (colore, taglia, etc.)
- **images**: Immagini prodotto/variante
- **attributes**: Attributi dinamici (metafields)

### Relazioni
- Category → CategoryFields (1:N)
- Category → Products (1:N)
- Product → Variants (1:N)
- Product → Options (1:N)
- Product → Images (1:N)
- Product → Attributes (1:N)
- Variant → Images (1:N)
- Variant → Attributes (1:N)

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- npm o yarn

### Setup Backend

1. **Installa dipendenze**
```bash
cd backend
npm install
```

2. **Configura ambiente**
```bash
cp .env.example .env
# Modifica .env con le tue configurazioni
```

3. **Avvia server**
```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3001`

### Setup Frontend

1. **Installa dipendenze**
```bash
cd frontend
npm install
```

2. **Installa Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Avvia development server**
```bash
npm start
```

Il frontend sarà disponibile su `http://localhost:3000`

## 📝 Configurazione

### Variabili Ambiente (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./database.sqlite

# Shopify API
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_API_VERSION=2025-01

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Security
CORS_ORIGIN=http://localhost:3000
```

### Configurazione Shopify

1. Crea un'app privata nel tuo Shopify Admin
2. Ottieni le credenziali API
3. Configura i permessi necessari:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`

## 🔧 API Endpoints

### Categorie
- `GET /api/categories` - Lista categorie
- `POST /api/categories` - Crea categoria
- `POST /api/categories/:id/fields` - Aggiungi campo

### Prodotti
- `GET /api/products` - Lista prodotti
- `POST /api/products` - Crea prodotto
- `POST /api/products/:id/variants` - Aggiungi variante

### Immagini
- `POST /api/images/upload` - Upload singola immagine
- `POST /api/images/upload-multiple` - Upload multiple

### Shopify
- `GET /api/shopify/preview/:id` - Anteprima export
- `POST /api/shopify/export/:id` - Export su Shopify

Vedi [API_DOCUMENTATION.md](API_DOCUMENTATION.md) per la documentazione completa.

## 🧪 Testing

### Test API con curl

```bash
# Test health check
curl http://localhost:3001/health

# Lista categorie
curl http://localhost:3001/api/categories

# Crea prodotto
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Product","status":"active"}'

# Preview export Shopify
curl http://localhost:3001/api/shopify/preview/1
```

### Seeding Database

```bash
cd backend
npm run seed
```

Questo creerà dati di esempio:
- 2 categorie (Electronics, Clothing)
- 5 campi categoria
- 2 prodotti con varianti
- Attributi e opzioni di esempio

## 📈 Funzionalità Avanzate

### Mapping Shopify Dinamico
- Conversione automatica prodotti → formato Shopify
- Gestione metafields per attributi personalizzati
- Validazione pre-export
- Sync bidirezionale

### Upload Immagini
- Supporto formati: JPEG, PNG, GIF, WebP
- Limite 5MB per file
- Upload multiplo (max 10 file)
- Associazione a prodotti/varianti

### Logging e Monitoring
- Log strutturati con Winston
- Rotazione automatica log
- Monitoring rate limit Shopify
- Error tracking dettagliato

## 🔒 Sicurezza

- Validazione input con Joi
- Sanitizzazione file upload
- CORS configurato
- Helmet per security headers
- Rate limiting (implementabile)

## 🚧 Roadmap

### Completato ✅
- [x] Backend API completo
- [x] Database e modelli
- [x] Integrazione Shopify
- [x] Upload immagini
- [x] Documentazione API

### In Sviluppo 🔄
- [x] Frontend EJS UI
- [ ] Componenti gestione categorie
- [ ] Componenti gestione prodotti
- [ ] UI upload immagini
- [ ] Dashboard Shopify export

### Pianificato 📋
- [ ] Autenticazione utenti
- [ ] Bulk operations UI
- [ ] Analytics e reporting
- [ ] Multi-store support
- [ ] API versioning

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi `LICENSE` per dettagli.

## 🆘 Supporto

Per supporto e domande:
- Apri un issue su GitHub
- Consulta la [documentazione API](API_DOCUMENTATION.md)
- Verifica i log in `backend/logs/`

## 📊 Statistiche Progetto

- **Linee di codice**: 2000+
- **API endpoints**: 50+
- **Modelli database**: 7
- **Test coverage**: In sviluppo
- **Tempo sviluppo**: 1 giorno (backend completo)

---

**Sviluppato con ❤️ per la gestione efficiente dell'inventario Shopify**