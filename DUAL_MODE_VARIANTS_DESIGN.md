# 🎯 Dual Mode Variants: Automatica + Manuale

## Obiettivo
Supportare sia generazione automatica che creazione manuale delle variants con interfaccia utente intuitiva.

## 🔄 Modalità Ibride Supportate

### **Modalità 1: Generazione Automatica**
1. Utente definisce Options: "Color: Red, Blue" + "Size: S, M, L"
2. Sistema genera automaticamente 6 variants (2×3)
3. Utente può modificare prezzo/stock/SKU per ogni variant
4. Utente può eliminare variants non desiderate

### **Modalità 2: Creazione Manuale**
1. Utente crea variants una per una
2. Per ogni variant, può associare option values
3. Sistema suggerisce combinations disponibili
4. Validazione per evitare duplicati

### **Modalità 3: Ibrida (Migliore)**
1. Utente definisce Options
2. Sceglie: "Genera Tutte" o "Aggiungi Manualmente"
3. Può generare automaticamente e poi aggiungere/rimuovere
4. Può creare manualmente e poi auto-completare

## 🎨 Design Interfaccia Utente

### **Sezione Options (Esistente Migliorata)**
```
┌─ Product Options ─────────────────────────────┐
│ ✅ Color: Red, Blue, Green                    │
│ ✅ Size: Small, Medium, Large                 │
│ ➕ Add Option                                 │
└───────────────────────────────────────────────┘
```

### **Sezione Variants (Nuova)**
```
┌─ Product Variants ────────────────────────────┐
│ Mode: ○ Manual  ● Auto-Generate  ○ Hybrid    │
│                                               │
│ [🔄 Generate All Combinations] [➕ Add Manual]│
│                                               │
│ Generated: 6 variants (2 Colors × 3 Sizes)   │
│                                               │
│ ┌─ Red - Small ──────────────────────────────┐│
│ │ Price: $10.00  SKU: RED-S  Stock: 100     ││
│ │ [Edit] [Delete]                           ││
│ └───────────────────────────────────────────┘│
│                                               │
│ ┌─ Red - Medium ─────────────────────────────┐│
│ │ Price: $12.00  SKU: RED-M  Stock: 50      ││
│ │ [Edit] [Delete]                           ││
│ └───────────────────────────────────────────┘│
│                                               │
│ ... (altre variants)                         │
└───────────────────────────────────────────────┘
```

### **Modal Creazione/Modifica Variant**
```
┌─ Edit Variant: Red - Small ──────────────────┐
│                                               │
│ Title: [Red - Small                        ]  │
│                                               │
│ Option Values:                                │
│ Color:  [Red      ▼] (from options)          │
│ Size:   [Small    ▼] (from options)          │
│                                               │
│ Pricing & Inventory:                          │
│ Price:     [$10.00]                           │
│ Compare:   [$15.00]                           │
│ SKU:       [RED-S]                            │
│ Stock:     [100]                              │
│                                               │
│ [Save] [Cancel]                               │
└───────────────────────────────────────────────┘
```

## 🔧 Implementazione Backend

### **API Endpoints**

```javascript
// Generazione automatica da options
POST /api/products/:id/variants/generate
{
  "mode": "all", // "all" | "missing" | "selected"
  "combinations": [
    {"Color": "Red", "Size": "Small"},
    {"Color": "Blue", "Size": "Large"}
  ] // optional, per generazione selettiva
}

// Creazione manuale variant
POST /api/products/:id/variants
{
  "title": "Red - Small",
  "price": 10.00,
  "sku": "RED-S",
  "inventory_quantity": 100,
  "option_values": [
    {"option_name": "Color", "option_value": "Red"},
    {"option_name": "Size", "option_value": "Small"}
  ]
}

// Aggiornamento variant con option values
PUT /api/variants/:id
{
  "title": "Red - Small",
  "price": 12.00,
  "option_values": [
    {"option_name": "Color", "option_value": "Red"},
    {"option_name": "Size", "option_value": "Small"}
  ]
}

// Validazione combinations disponibili
GET /api/products/:id/variants/available-combinations
// Returns: [{"Color": "Red", "Size": "XL"}, ...] (non ancora create)
```

### **Logica di Generazione**

```javascript
// Algoritmo generazione combinations
function generateCombinations(options) {
  const combinations = [];
  
  function cartesianProduct(arrays) {
    return arrays.reduce((acc, curr) => 
      acc.flatMap(x => curr.map(y => [...x, y])), [[]]
    );
  }
  
  const optionArrays = options.map(opt => 
    opt.values.map(val => ({name: opt.name, value: val}))
  );
  
  return cartesianProduct(optionArrays);
}

// Esempio: 
// Input: [{name: "Color", values: ["Red", "Blue"]}, {name: "Size", values: ["S", "M"]}]
// Output: [
//   [{name: "Color", value: "Red"}, {name: "Size", value: "S"}],
//   [{name: "Color", value: "Red"}, {name: "Size", value: "M"}],
//   [{name: "Color", value: "Blue"}, {name: "Size", value: "S"}],
//   [{name: "Color", value: "Blue"}, {name: "Size", value: "M"}]
// ]
```

## 🎛️ Controlli Utente

### **Workflow Flessibile**
1. **Start Clean**: Nessuna option → Creazione manuale variants
2. **Options First**: Definisce options → Sceglie modalità
3. **Auto-Generate**: Genera tutte le combinations
4. **Selective Generate**: Genera solo combinations specifiche
5. **Manual Add**: Aggiunge variants individuali
6. **Hybrid Edit**: Modifica variants generate + aggiunge manuali

### **Validazioni Smart**
- **Duplicate Prevention**: Non permette combinations duplicate
- **Option Consistency**: Variants devono usare values dalle options definite
- **Missing Combinations**: Suggerisce combinations mancanti
- **Orphan Detection**: Avvisa se variants hanno option values non più nelle options

### **UX Enhancements**
- **Preview**: Mostra quante variants verranno generate
- **Bulk Edit**: Modifica prezzo/stock per multiple variants
- **Template**: Applica template di pricing (es. Size S: +$0, M: +$2, L: +$5)
- **Import/Export**: CSV per gestione bulk variants

## 📊 Esempi Pratici

### **Scenario 1: T-Shirt Shop**
```
Options: Color (Red, Blue, Green) × Size (S, M, L, XL)
Auto-Generate: 12 variants
User Action: Rimuove "Green-XL" (non disponibile)
Result: 11 variants attive
```

### **Scenario 2: Accessori Custom**
```
Options: Material (Leather, Fabric) × Color (Black, Brown)
Manual Create: Solo "Leather-Black" e "Fabric-Brown"
Result: 2 variants specifiche (non tutte le 4 combinations)
```

### **Scenario 3: Prodotto Complesso**
```
Options: Type (Basic, Premium) × Color (5 colors) × Size (4 sizes)
Selective Generate: Solo Premium variants (5×4 = 20)
Manual Add: Basic-Black-Medium (variant speciale)
Result: 21 variants totali
```

## 🔄 Migration Strategy

### **Variants Esistenti**
1. **Preserve**: Mantiene variants esistenti
2. **Auto-Detect**: Cerca di inferire option values da title/sku
3. **Manual Mapping**: UI per associare option values a variants esistenti
4. **Gradual Migration**: Permette mix di variants "old" e "new"

Questa soluzione offre **massima flessibilità** mantenendo **semplicità d'uso** per tutti i casi d'uso.