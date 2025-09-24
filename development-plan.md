# Piano di Sviluppo Dettagliato - Applicazione Shopify Inventory

## Stack Tecnologico Definitivo

- **Backend**: Node.js + Express + Sequelize + SQLite
- **Frontend**: React SPA + Tailwind CSS + Axios
- **Upload**: Filesystem locale + serve static files
- **Database**: SQLite con Sequelize ORM
- **API**: REST endpoints per comunicazione frontend-backend

## Architettura del Progetto

```
inventario2/
├── backend/
│   ├── config/
│   │   ├── database.js          # Configurazione Sequelize
│   │   └── shopify.js           # Configurazione API Shopify
│   ├── models/
│   │   ├── index.js             # Setup Sequelize e associazioni
│   │   ├── Category.js          # Modello categorie
│   │   ├── CategoryField.js     # Modello campi categoria
│   │   ├── Product.js           # Modello prodotti
│   │   ├── Variant.js           # Modello varianti
│   │   ├── Option.js            # Modello opzioni
│   │   ├── Image.js             # Modello immagini
│   │   └── Attribute.js         # Modello attributi
│   ├── routes/
│   │   ├── categories.js        # API categorie e category_fields
│   │   ├── products.js          # API prodotti
│   │   ├── variants.js          # API varianti
│   │   ├── images.js            # API immagini e upload
│   │   ├── attributes.js        # API attributi
│   │   └── shopify.js           # API export Shopify
│   ├── middleware/
│   │   ├── auth.js              # Middleware autenticazione
│   │   ├── upload.js            # Middleware upload immagini
│   │   ├── validation.js        # Middleware validazione
│   │   └── errorHandler.js      # Gestione errori centralizzata
│   ├── services/
│   │   ├── shopifyMapper.js     # Mapping dati → Shopify JSON
│   │   ├── shopifyApi.js        # Client API Shopify
│   │   └── imageService.js      # Gestione immagini
│   ├── migrations/
│   │   └── [timestamp]-create-tables.js
│   ├── seeders/
│   │   └── demo-data.js         # Dati di esempio
│   ├── uploads/                 # Directory immagini
│   ├── app.js                   # Setup Express app
│   ├── server.js                # Entry point server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Componenti riutilizzabili
│   │   │   ├── categories/      # Gestione categorie
│   │   │   ├── products/        # Gestione prodotti
│   │   │   ├── variants/        # Gestione varianti
│   │   │   ├── images/          # Upload e gestione immagini
│   │   │   └── attributes/      # Gestione attributi dinamici
│   │   ├── pages/
│   │   │   ├── Dashboard.js     # Dashboard principale
│   │   │   ├── Categories.js    # Pagina categorie
│   │   │   ├── Products.js      # Pagina prodotti
│   │   │   └── ProductDetail.js # Dettaglio prodotto
│   │   ├── services/
│   │   │   ├── api.js           # Client API Axios
│   │   │   └── shopify.js       # Servizi Shopify
│   │   ├── utils/
│   │   │   ├── validation.js    # Validazioni frontend
│   │   │   └── helpers.js       # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # React Context per state
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
├── shared/
│   └── types/                   # Tipi condivisi (se TypeScript)
├── .env.example                 # Template variabili ambiente
├── .gitignore
├── README.md
└── docker-compose.yml           # Setup opzionale con Docker
```

## Flusso di Sviluppo Dettagliato

### Fase 1: Setup Iniziale e Fondamenta (Giorni 1-2)

#### 1.1 Setup Progetto Base
```bash
# Inizializzazione progetto
mkdir inventario2 && cd inventario2
mkdir backend frontend shared

# Setup backend
cd backend
npm init -y
npm install express sequelize sqlite3 cors helmet morgan dotenv multer axios joi winston
npm install -D nodemon

# Setup frontend
cd ../frontend
npx create-react-app . --template typescript
npm install axios react-router-dom @headlessui/react @heroicons/react
npm install -D tailwindcss postcss autoprefixer
```

#### 1.2 Configurazione Base Backend
- Setup Express server con middleware essenziali (CORS, helmet, morgan)
- Configurazione dotenv per variabili ambiente
- Setup logging con Winston
- Middleware per gestione errori centralizzata

#### 1.3 Configurazione Database
- Setup Sequelize con SQLite
- Configurazione connessione database
- Setup migrazioni e seeders

### Fase 2: Modelli Database e API Base (Giorni 3-5)

#### 2.1 Creazione Modelli Sequelize

**Category Model**
```javascript
// models/Category.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    shopify_product_type: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  });

  return Category;
};
```

**Associazioni tra Modelli**
```javascript
// models/index.js
// Definizione di tutte le associazioni:
// Category hasMany CategoryField
// Category hasMany Product
// Product hasMany Variant
// Product hasMany Option
// Product hasMany Image
// Product hasMany Attribute
// Variant hasMany Image
// Variant hasMany Attribute
```

#### 2.2 Migrazioni Database
- Creazione tabelle con vincoli di integrità
- Indici per performance su campi frequentemente interrogati
- Dati di seed per testing

#### 2.3 API REST Base
- CRUD completo per Categories
- CRUD completo per CategoryFields
- Validazione input con Joi
- Gestione errori strutturata

### Fase 3: API Prodotti e Gestione Complessa (Giorni 6-8)

#### 3.1 API Prodotti
```javascript
// routes/products.js
// GET /api/products - Lista prodotti con paginazione
// GET /api/products/:id - Dettaglio prodotto con relazioni
// POST /api/products - Creazione prodotto
// PUT /api/products/:id - Aggiornamento prodotto
// DELETE /api/products/:id - Eliminazione prodotto
```

#### 3.2 API Varianti e Opzioni
- Gestione varianti multiple per prodotto
- Calcolo automatico combinazioni opzioni
- Validazione SKU univoci

#### 3.3 Sistema Upload Immagini
```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse'));
    }
  }
});
```

#### 3.4 API Attributi Dinamici
- Gestione attributi per prodotti e varianti
- Validazione tipi di dato (string, number, boolean, date)
- Namespace per organizzazione attributi

### Fase 4: Layer Shopify Integration (Giorni 9-10)

#### 4.1 Shopify Mapper Service
```javascript
// services/shopifyMapper.js
class ShopifyMapper {
  static mapProductToShopify(product) {
    return {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: product.tags,
        handle: product.handle,
        status: product.status,
        variants: product.Variants.map(variant => ({
          sku: variant.sku,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
          barcode: variant.barcode,
          inventory_quantity: variant.inventory_quantity,
          inventory_management: variant.inventory_management
        })),
        images: product.Images.map(image => ({
          src: image.src,
          alt: image.alt_text,
          position: image.position
        })),
        metafields: this.mapAttributesToMetafields(product.Attributes)
      }
    };
  }

  static mapAttributesToMetafields(attributes) {
    return attributes.map(attr => ({
      namespace: attr.namespace || 'custom',
      key: attr.key,
      value: attr.value,
      type: this.getShopifyMetafieldType(attr.value_type)
    }));
  }
}
```

#### 4.2 Shopify API Client
```javascript
// services/shopifyApi.js
class ShopifyApiClient {
  constructor() {
    this.baseURL = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2025-01`;
    this.headers = {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    };
  }

  async createProduct(productData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/products.json`,
        productData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Shopify API Error: ${error.response?.data?.errors || error.message}`);
    }
  }

  async updateProduct(shopifyId, productData) {
    try {
      const response = await axios.put(
        `${this.baseURL}/products/${shopifyId}.json`,
        productData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Shopify API Error: ${error.response?.data?.errors || error.message}`);
    }
  }
}
```

### Fase 5: Frontend React Development (Giorni 11-15)

#### 5.1 Setup Base React
- Configurazione Tailwind CSS
- Setup React Router
- Creazione layout base e navigazione
- Setup Axios client per API calls

#### 5.2 Componenti Gestione Categorie
```jsx
// components/categories/CategoryManager.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFields, setCategoryFields] = useState([]);

  // CRUD operations per categorie
  // Form per creazione/modifica categoria
  // Gestione campi dinamici per categoria
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryList 
        categories={categories}
        onSelect={setSelectedCategory}
      />
      <CategoryFieldsManager 
        category={selectedCategory}
        fields={categoryFields}
        onFieldsChange={setCategoryFields}
      />
    </div>
  );
};
```

#### 5.3 Componenti Gestione Prodotti
- Lista prodotti con filtri e ricerca
- Form creazione/modifica prodotto
- Gestione associazione categoria
- Preview dati prodotto

#### 5.4 Componenti Gestione Varianti
```jsx
// components/variants/VariantManager.jsx
const VariantManager = ({ product, onVariantsChange }) => {
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);

  // Generazione automatica combinazioni varianti
  const generateVariantCombinations = () => {
    // Logica per generare tutte le combinazioni possibili
    // basate sulle opzioni definite
  };

  return (
    <div className="space-y-6">
      <OptionsManager 
        options={options}
        onChange={setOptions}
      />
      <VariantGrid 
        variants={variants}
        onChange={setVariants}
      />
    </div>
  );
};
```

#### 5.5 Sistema Upload Immagini
```jsx
// components/images/ImageUploader.jsx
const ImageUploader = ({ productId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files) => {
    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await apiClient.post(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(prev => [...prev, ...response.data]);
      onImagesChange(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        {/* UI per drag & drop */}
      </label>
      <ImagePreviewGrid images={images} />
    </div>
  );
};
```

### Fase 6: Integrazione e Funzionalità Avanzate (Giorni 16-18)

#### 6.1 Gestione Attributi Dinamici Frontend
- Form dinamico basato su category_fields
- Validazione client-side
- Preview attributi come metafields Shopify

#### 6.2 Export Shopify Integration
```jsx
// components/shopify/ExportManager.jsx
const ExportManager = ({ product }) => {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.post(`/shopify/export/${product.id}`);
      setExportResult(response.data);
      
      // Aggiorna shopify_id nel prodotto locale
      if (response.data.shopify_id) {
        await apiClient.put(`/products/${product.id}`, {
          shopify_id: response.data.shopify_id
        });
      }
    } catch (error) {
      setExportResult({ error: error.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Export to Shopify</h3>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export to Shopify'}
      </button>
      {exportResult && (
        <div className="mt-4">
          {exportResult.error ? (
            <div className="text-red-600">{exportResult.error}</div>
          ) : (
            <div className="text-green-600">
              Successfully exported! Shopify ID: {exportResult.shopify_id}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 6.3 Dashboard e Analytics
- Overview prodotti e categorie
- Statistiche export Shopify
- Log delle operazioni

### Fase 7: Testing e Ottimizzazioni (Giorni 19-20)

#### 7.1 Testing Backend
- Unit tests per modelli Sequelize
- Integration tests per API endpoints
- Test mapping Shopify

#### 7.2 Testing Frontend
- Component testing con React Testing Library
- E2E testing con Cypress
- Test upload immagini

#### 7.3 Ottimizzazioni Performance
- Lazy loading componenti React
- Paginazione API
- Caching strategico
- Ottimizzazione query database

### Fase 8: Deployment e Documentazione (Giorno 21)

#### 8.1 Setup Deployment
- Configurazione variabili ambiente produzione
- Build ottimizzato React
- Setup reverse proxy (nginx)
- SSL configuration

#### 8.2 Documentazione
- API documentation con Swagger
- README completo
- Guide deployment
- Troubleshooting guide

## Variabili Ambiente Necessarie

```env
# Database
DATABASE_URL=sqlite:./database.sqlite

# Server
PORT=3001
NODE_ENV=development

# Shopify API
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_API_VERSION=2025-01

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

## Considerazioni Tecniche Aggiuntive

### Sicurezza
- Validazione input rigorosa
- Rate limiting su API
- Sanitizzazione file upload
- Protezione credenziali Shopify

### Performance
- Indici database ottimizzati
- Compressione immagini
- Caching headers per static files
- Lazy loading React components

### Scalabilità
- Struttura modulare per estensioni future
- Separazione concerns (services, controllers)
- Database migrations per evoluzione schema
- API versioning strategy

### Monitoring
- Logging strutturato con Winston
- Error tracking
- Performance monitoring
- Shopify API rate limit monitoring

Questo piano fornisce una roadmap completa e dettagliata per lo sviluppo dell'applicazione, risolvendo tutte le criticità identificate nel progetto originale e aggiungendo le best practices necessarie per un'applicazione robusta e scalabile.