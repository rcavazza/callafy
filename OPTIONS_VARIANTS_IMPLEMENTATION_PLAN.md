# 🎯 Options-Variants Integration Plan

## Obiettivo
Collegare correttamente Options e Variants per export Shopify completo

## Fasi di Implementazione

### FASE 1: Database Schema
- [ ] Creare modello VariantOption (junction table)
- [ ] Aggiornare associazioni Sequelize
- [ ] Aggiungere campo option_combination a Variant
- [ ] Testare migrazioni database

### FASE 2: Backend API
- [ ] Endpoint per generare variants da options
- [ ] Aggiornare logica creazione/aggiornamento prodotti
- [ ] Implementare validazione option-variant consistency
- [ ] Aggiornare ShopifyMapper con selectedOptions

### FASE 3: Frontend UI
- [ ] Modalità "Genera da Options" vs "Manuale"
- [ ] UI per associare option values a variants esistenti
- [ ] Preview delle combinazioni generate
- [ ] Validazione frontend per consistency

### FASE 4: Export Shopify
- [ ] Mappare selectedOptions per ogni variant
- [ ] Testare export con prodotti multi-option
- [ ] Validare struttura dati Shopify
- [ ] Test end-to-end con Shopify API

### FASE 5: Testing & Refinement
- [ ] Test creazione prodotto con 1 option
- [ ] Test creazione prodotto con 2+ options
- [ ] Test aggiornamento variants esistenti
- [ ] Test export Shopify completo
- [ ] Performance testing con molte combinazioni

## Strutture Dati

### VariantOption Model
```javascript
{
  id: INTEGER,
  variant_id: INTEGER (FK),
  option_name: STRING, // "Color"
  option_value: STRING // "Red"
}
```

### Variant Model (aggiornato)
```javascript
{
  // campi esistenti...
  title: STRING, // "Red - Small"
  option_combination: JSON // {"Color": "Red", "Size": "Small"}
}
```

### Shopify Export Format
```json
{
  "variants": [
    {
      "price": "10.00",
      "selectedOptions": [
        {"name": "Color", "value": "Red"},
        {"name": "Size", "value": "Small"}
      ]
    }
  ]
}
```

## Vantaggi della Soluzione

1. **Compatibilità Shopify**: selectedOptions standard
2. **Flessibilità**: Supporta sia generazione automatica che manuale
3. **Scalabilità**: Gestisce N options con M values
4. **Retrocompatibilità**: Non rompe variants esistenti
5. **Performance**: Junction table ottimizzata per query

## Considerazioni Tecniche

- **Transazioni**: Creazione atomica variants + options
- **Validazione**: Consistency tra options e variant combinations
- **UI/UX**: Interfaccia intuitiva per gestione combinations
- **Performance**: Ottimizzazione per prodotti con molte variants
- **Migration**: Strategia per dati esistenti