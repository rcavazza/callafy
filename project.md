Progetto: Applicazione Shopify con UI per CRUD e Gestione Categorie Dinamiche

Obiettivo
- Creare e gestire prodotti con varianti, immagini e attributi dinamici.
- Gestire categorie con strutture personalizzabili.
- Mappare i dati verso Shopify e esportarli tramite API REST.
- Fornire una UI completa per CRUD sui prodotti, varianti, immagini, attributi e categorie.

Schema DB (Modello Ibrido)

Tabella categories
- id (PK)
- name
- description
- shopify_product_type
- status

Tabella category_fields
- id (PK)
- category_id (FK → categories.id)
- name
- field_type
- required
- position

Tabella products
- id (PK)
- title
- description
- vendor
- product_type
- tags
- handle
- status
- shopify_id
- category_id (FK → categories.id)

Tabella variants
- id (PK)
- product_id (FK → products.id)
- sku
- price
- compare_at_price
- option1
- option2
- option3
- barcode
- inventory_quantity
- inventory_management
- shopify_id

Tabella options
- id (PK)
- product_id (FK → products.id)
- name
- position

Tabella images
- id (PK)
- product_id (FK → products.id)
- variant_id (FK → variants.id, opzionale)
- src
- alt_text
- position

Tabella attributes
- id (PK)
- product_id (FK → products.id)
- variant_id (FK → variants.id, opzionale)
- category
- key
- value
- value_type
- namespace

Flusso di sviluppo

1. Setup progetto
- Node.js + Express per backend.
- Database: SQLite + ORM (Sequelize/Prisma).
- Frontend: EJS templates con Vanilla JavaScript.
- Fetch API per chiamate API backend.
- Dotenv per variabili ambiente.
- Libreria UI (Tailwind, Material UI, ecc.).

2. Backend
- API REST per CRUD:
  - /categories e /category_fields
  - /products, /variants, /options, /images, /attributes
  - /export/:product_id per Shopify
- Layer di mapping dinamico:
  - Trasforma prodotti interni in JSON Shopify.
  - Converte attributi dinamici in metafields.

3. Frontend (UI mandatoria)
- Gestione categorie: crea/modifica/elimina categorie e campi associati.
- Gestione prodotti: CRUD prodotti associati a categorie.
- Gestione varianti e opzioni: aggiunta multipla e anteprima combinazioni.
- Gestione immagini: upload multiplo e anteprima.
- Gestione attributi dinamici: modifica valori per ogni prodotto/variante.
- Export Shopify: pulsante per generare JSON e inviare API.

4. Layer di Mapping
Funzione centrale che riceve dati dal DB e genera JSON Shopify conforme.

5. Esportazione su Shopify
- Axios con autenticazione API Shopify.
- POST /admin/api/2025-01/products.json per nuovi prodotti.
- PUT /admin/api/2025-01/products/{id}.json per aggiornamenti.
- Salvataggio ID Shopify nel DB.

6. Sincronizzazione e logging
- Gestione stock, prezzo e aggiornamenti attributi.
- Logging con retry in caso di errori.

7. Flusso utente completo
1. Crea categoria e definisce campi.
2. Crea prodotto associato alla categoria.
3. Aggiunge varianti, immagini e valori degli attributi.
4. Visualizza anteprima, salva e modifica.
5. Esporta su Shopify tramite pulsante nella UI.
6. Aggiorna e sincronizza i cambiamenti in tempo reale.

Vantaggi del modello
- Gestione flessibile e scalabile di categorie e prodotti.
- UI integrata per gestione completa degli oggetti e delle categorie.
- Mapping dinamico verso Shopify tramite metafields.
- Possibilità di estendere a nuovi marketplace senza cambiare schema.

Diagramma ER ASCII:

      +----------------+        +--------------------+
      |   categories   |<-------|   category_fields  |
      +----------------+        +--------------------+
      | id (PK)        |        | id (PK)            |
      | name           |        | category_id (FK)   |
      | shopify_type   |        | name               |
      +----------------+        | field_type         |
                                | required           |
                                +--------------------+
             ^
             |
             |
      +----------------+
      |    products    |
      +----------------+
      | id (PK)        |
      | title          |
      | category_id(FK)|
      +----------------+
        ^        ^       ^
        |        |       |
+---------------+ | +----------------+
|   variants    | | |     options    |
+---------------+ | +----------------+
| id (PK)       | | | id (PK)        |
| product_id(FK)| | | product_id(FK) |
| sku           | | | name           |
+---------------+ | +----------------+
                  |
                  v
             +----------------+
             |     images     |
             +----------------+
             | id (PK)        |
             | product_id(FK) |
             | variant_id(FK) |
             | src            |
             +----------------+
                  ^
                  |
                  v
             +----------------+
             |   attributes   |
             +----------------+
             | id (PK)        |
             | product_id(FK) |
             | variant_id(FK) |
             | key            |
             | value          |
             +----------------+
