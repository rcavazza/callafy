/**
 * Dual-Mode Variants Manager
 * Supports both automatic generation and manual creation of product variants
 */

console.log('🔧 VariantsManager: Loading variants-manager.js file - VERSION 20250924173700 - EDIT MODE FIXED');

class VariantsManager {
    constructor(containerOrId) {
        // Accept both DOM element and ID string
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
            console.log('🔧 VariantsManager: Initializing with container ID:', containerOrId, this.container);
        } else {
            this.container = containerOrId;
            console.log('🔧 VariantsManager: Initializing with container element:', this.container);
        }
        
        this.productId = null;
        this.options = [];
        this.variants = [];
        this.mode = 'manual'; // 'manual', 'auto', 'hybrid'
        this.variantCounter = 0;
        
        if (!this.container) {
            console.error('🔧 VariantsManager: Container not found:', containerOrId);
            return;
        }
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        console.log('🔧 VariantsManager: Rendering HTML content');
        this.container.innerHTML = `
            <div class="variants-manager">
                <!-- Mode Selector -->
                <div class="variants-header">
                    <h3>🔧 Gestione Varianti</h3>
                    <div class="mode-selector">
                        <label class="mode-option">
                            <input type="radio" name="variantMode" value="manual" ${this.mode === 'manual' ? 'checked' : ''}>
                            <span>📝 Manuale</span>
                        </label>
                        <label class="mode-option">
                            <input type="radio" name="variantMode" value="auto" ${this.mode === 'auto' ? 'checked' : ''}>
                            <span>🤖 Automatica</span>
                        </label>
                        <label class="mode-option">
                            <input type="radio" name="variantMode" value="hybrid" ${this.mode === 'hybrid' ? 'checked' : ''}>
                            <span>🔄 Ibrida</span>
                        </label>
                    </div>
                </div>
                
                <!-- Options Section -->
                <div class="options-section" id="optionsSection">
                    <div class="section-header">
                        <h4>📋 Opzioni Prodotto</h4>
                        <button type="button" class="btn btn-outline btn-sm" id="addOptionBtn">
                            ➕ Aggiungi Opzione
                        </button>
                    </div>
                    <div id="optionsList" class="options-list">
                        <!-- Options will be rendered here -->
                    </div>
                </div>
                
                <!-- Generation Controls -->
                <div class="generation-controls" id="generationControls" style="display: none;">
                    <div class="control-group">
                        <button type="button" class="btn btn-primary" id="generateAllBtn">
                            🔄 Genera Tutte le Combinazioni
                        </button>
                        <button type="button" class="btn btn-outline" id="previewBtn">
                            👁️ Anteprima Combinazioni
                        </button>
                    </div>
                    <div class="generation-stats" id="generationStats">
                        <!-- Stats will be shown here -->
                    </div>
                </div>
                
                <!-- Variants Section -->
                <div class="variants-section" id="variantsSection">
                    <div class="section-header">
                        <h4>📦 Varianti</h4>
                        <div class="variants-actions">
                            <button type="button" class="btn btn-outline btn-sm" id="addVariantBtn">
                                ➕ Aggiungi Variante
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" id="bulkEditBtn" style="display: none;">
                                📊 Modifica Multipla
                            </button>
                        </div>
                    </div>
                    <div id="variantsList" class="variants-list">
                        <!-- Variants will be rendered here -->
                    </div>
                </div>
                
                <!-- Available Combinations -->
                <div class="available-combinations" id="availableCombinations" style="display: none;">
                    <h4>🎯 Combinazioni Disponibili</h4>
                    <div id="combinationsList" class="combinations-list">
                        <!-- Available combinations will be shown here -->
                    </div>
                </div>
            </div>
        `;
        
        this.updateModeDisplay();
        this.renderOptions();
        this.renderVariants();
    }
    
    attachEventListeners() {
        // Mode selector
        this.container.querySelectorAll('input[name="variantMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.updateModeDisplay();
            });
        });
        
        // Options management
        const addOptionBtn = this.container.querySelector('#addOptionBtn');
        console.log('🔧 VariantsManager: Looking for #addOptionBtn:', addOptionBtn);
        if (addOptionBtn) {
            console.log('🔧 VariantsManager: Adding click listener to #addOptionBtn');
            addOptionBtn.addEventListener('click', () => {
                console.log('🔧 VariantsManager: #addOptionBtn clicked, calling addOption()');
                try {
                    this.addOption();
                } catch (error) {
                    console.error('🔧 VariantsManager: ERROR in addOption():', error);
                }
            });
            
        } else {
            console.error('🔧 VariantsManager: #addOptionBtn not found in container');
        }
        
        // Generation controls
        this.container.querySelector('#generateAllBtn').addEventListener('click', () => {
            this.generateAllVariants();
        });
        
        this.container.querySelector('#previewBtn').addEventListener('click', () => {
            this.previewCombinations();
        });
        
        // Variants management
        this.container.querySelector('#addVariantBtn').addEventListener('click', () => {
            this.addVariant();
        });
        
        this.container.querySelector('#bulkEditBtn').addEventListener('click', () => {
            this.openBulkEdit();
        });
    }
    
    updateModeDisplay() {
        const generationControls = this.container.querySelector('#generationControls');
        const availableCombinations = this.container.querySelector('#availableCombinations');
        const bulkEditBtn = this.container.querySelector('#bulkEditBtn');
        
        switch (this.mode) {
            case 'manual':
                generationControls.style.display = 'none';
                availableCombinations.style.display = 'none';
                bulkEditBtn.style.display = 'none';
                break;
            case 'auto':
                generationControls.style.display = 'block';
                availableCombinations.style.display = 'block';
                bulkEditBtn.style.display = 'inline-block';
                break;
            case 'hybrid':
                generationControls.style.display = 'block';
                availableCombinations.style.display = 'block';
                bulkEditBtn.style.display = 'inline-block';
                break;
        }
        
        this.updateGenerationStats();
    }
    
    addOption(optionData = null) {
        console.log('🔧 VariantsManager: addOption() CALLED - NEW WORKING VERSION!');
        
        // Create new option with default values
        const newOption = optionData || {
            id: null,
            name: '',
            position: this.options.length + 1,
            values: []
        };
        
        console.log('🔧 VariantsManager: Creating new option:', newOption);
        
        // Add to options array
        this.options.push(newOption);
        console.log('🔧 VariantsManager: Options array now has', this.options.length, 'options');
        
        // Update the UI immediately
        this.renderOptions();
        this.updateGenerationStats();
        
        console.log('🔧 VariantsManager: addOption() completed successfully!');
        return newOption;
    }
    
    // Test method with different name
    testNewOption() {
        console.log('🔧 VariantsManager: testNewOption() CALLED - THIS IS A TEST METHOD!');
        console.log('🔧 VariantsManager: this.options before:', this.options);
        
        const newOption = {
            id: null,
            name: 'Test Option',
            position: this.options.length + 1,
            values: ['Test Value 1', 'Test Value 2']
        };
        
        console.log('🔧 VariantsManager: Adding test option:', newOption);
        this.options.push(newOption);
        console.log('🔧 VariantsManager: this.options after:', this.options);
        console.log('🔧 VariantsManager: testNewOption() COMPLETED!');
        
        return 'TEST_METHOD_SUCCESS';
    }
    
    removeOption(index) {
        this.options.splice(index, 1);
        this.renderOptions();
        this.updateGenerationStats();
    }
    
    renderOptions() {
        console.log('🔧 VariantsManager: renderOptions() called with', this.options.length, 'options');
        const optionsList = this.container.querySelector('#optionsList');
        console.log('🔧 VariantsManager: optionsList element:', optionsList);
        
        if (this.options.length === 0) {
            console.log('🔧 VariantsManager: No options, showing empty state');
            optionsList.innerHTML = `
                <div class="empty-state">
                    <p>Nessuna opzione definita. Aggiungi opzioni per creare varianti.</p>
                </div>
            `;
            return;
        }
        
        optionsList.innerHTML = this.options.map((option, index) => `
            <div class="option-item" data-index="${index}">
                <div class="option-header">
                    <span class="option-title">Opzione ${index + 1}</span>
                    <button type="button" class="btn btn-danger btn-sm" onclick="window.variantsManager.removeOption(${index})">
                        🗑️
                    </button>
                </div>
                <div class="option-fields">
                    <div class="form-group">
                        <label class="form-label">Nome Opzione *</label>
                        <input
                            type="text"
                            class="form-input"
                            value="${option.name}"
                            placeholder="Es. Colore, Taglia, Materiale"
                            onchange="window.variantsManager.updateOption(${index}, 'name', this.value)"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valori (separati da virgola) *</label>
                        <input
                            type="text"
                            class="form-input"
                            value="${option.values.join(', ')}"
                            placeholder="Es. Rosso, Blu, Verde"
                            onchange="window.variantsManager.updateOption(${index}, 'values', this.value.split(',').map(v => v.trim()).filter(v => v))"
                            required
                        >
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateOption(index, field, value) {
        if (this.options[index]) {
            this.options[index][field] = value;
            this.updateGenerationStats();
        }
    }
    
    updateGenerationStats() {
        console.log('🔧 VariantsManager: updateGenerationStats() called');
        try {
            const statsContainer = this.container.querySelector('#generationStats');
            console.log('🔧 VariantsManager: statsContainer found:', !!statsContainer);
            
            if (!statsContainer) {
                console.warn('🔧 VariantsManager: #generationStats element not found');
                return;
            }
            
            if (this.options.length === 0) {
                statsContainer.innerHTML = '<p class="text-muted">Definisci almeno un\'opzione per vedere le statistiche.</p>';
                return;
            }
            
            const validOptions = this.options.filter(opt => opt.name && opt.values.length > 0);
            
            if (validOptions.length === 0) {
                statsContainer.innerHTML = '<p class="text-muted">Completa le opzioni per vedere le statistiche.</p>';
                return;
            }
            
            const totalCombinations = validOptions.reduce((total, option) => total * option.values.length, 1);
            const existingVariants = this.variants.length;
            const availableCombinations = totalCombinations - existingVariants;
            
            statsContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Combinazioni Totali:</span>
                        <span class="stat-value">${totalCombinations}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Varianti Esistenti:</span>
                        <span class="stat-value">${existingVariants}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Disponibili:</span>
                        <span class="stat-value">${availableCombinations}</span>
                    </div>
                </div>
            `;
            console.log('🔧 VariantsManager: updateGenerationStats() completed successfully');
        } catch (error) {
            console.error('🔧 VariantsManager: Error in updateGenerationStats():', error);
        }
    }
    
    async generateAllVariants() {
        if (!this.productId) {
            showError('Salva prima il prodotto per generare le varianti');
            return;
        }
        
        try {
            const response = await fetch(`/api/products/${this.productId}/variants/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'all' })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nella generazione delle varianti');
            }
            
            const result = await response.json();
            showSuccess(`Generate ${result.created} varianti con successo!`);
            
            // Reload variants
            await this.loadVariants();
            
        } catch (error) {
            console.error('Error generating variants:', error);
            showError(error.message);
        }
    }
    
    async previewCombinations() {
        if (!this.productId) {
            showError('Salva prima il prodotto per vedere le combinazioni');
            return;
        }
        
        try {
            const response = await fetch(`/api/products/${this.productId}/variants/available-combinations`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nel caricamento delle combinazioni');
            }
            
            const result = await response.json();
            this.showAvailableCombinations(result.availableCombinations);
            
        } catch (error) {
            console.error('Error loading combinations:', error);
            showError(error.message);
        }
    }
    
    showAvailableCombinations(combinations) {
        const combinationsContainer = this.container.querySelector('#combinationsList');
        const availableSection = this.container.querySelector('#availableCombinations');
        
        if (combinations.length === 0) {
            combinationsContainer.innerHTML = '<p class="text-muted">Tutte le combinazioni sono già state create.</p>';
        } else {
            combinationsContainer.innerHTML = combinations.map((combo, index) => `
                <div class="combination-item">
                    <div class="combination-options">
                        ${combo.options.map(opt => `
                            <span class="option-tag">${opt.option_name}: ${opt.value}</span>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.variantsManager.createVariantFromCombination(${index})">
                        ➕ Crea Variante
                    </button>
                </div>
            `).join('');
        }
        
        availableSection.style.display = 'block';
    }
    
    async createVariantFromCombination(combinationIndex) {
        // Implementation for creating a variant from a specific combination
        console.log('Creating variant from combination:', combinationIndex);
    }
    
    addVariant(variantData = null) {
        const variant = variantData || {
            id: null,
            sku: '',
            price: 0,
            compare_at_price: null,
            inventory_quantity: 0,
            barcode: '',
            weight: null,
            selectedOptions: [],
            images: []
        };
        
        this.variants.push(variant);
        this.renderVariants();
        this.updateGenerationStats();
    }
    
    removeVariant(index) {
        this.variants.splice(index, 1);
        this.renderVariants();
        this.updateGenerationStats();
    }
    
    renderVariants() {
        const variantsList = this.container.querySelector('#variantsList');
        
        if (this.variants.length === 0) {
            variantsList.innerHTML = `
                <div class="empty-state">
                    <p>Nessuna variante creata. ${this.mode === 'manual' ? 'Aggiungi varianti manualmente' : 'Genera varianti automaticamente dalle opzioni'}.</p>
                </div>
            `;
            return;
        }
        
        variantsList.innerHTML = this.variants.map((variant, index) => `
            <div class="variant-item" data-index="${index}">
                <div class="variant-header">
                    <div class="variant-title">
                        <span>Variante ${index + 1}</span>
                        ${variant.selectedOptions.length > 0 ? `
                            <div class="variant-options">
                                ${variant.selectedOptions.map(opt => `
                                    <span class="option-tag">${opt.name}: ${opt.value}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="window.variantsManager.removeVariant(${index})">
                        🗑️
                    </button>
                </div>
                <div class="variant-fields">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">SKU</label>
                            <input
                                type="text"
                                class="form-input"
                                value="${variant.sku || ''}"
                                placeholder="SKU-${index + 1}"
                                onchange="window.variantsManager.updateVariant(${index}, 'sku', this.value)"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prezzo *</label>
                            <input
                                type="number"
                                class="form-input"
                                value="${variant.price || ''}"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                onchange="window.variantsManager.updateVariant(${index}, 'price', parseFloat(this.value) || null)"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prezzo Confronto</label>
                            <input
                                type="number"
                                class="form-input"
                                value="${variant.compare_at_price || ''}"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                onchange="window.variantsManager.updateVariant(${index}, 'compare_at_price', parseFloat(this.value) || null)"
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Inventario</label>
                            <input
                                type="number"
                                class="form-input"
                                value="${variant.inventory_quantity || 0}"
                                min="0"
                                placeholder="0"
                                onchange="window.variantsManager.updateVariant(${index}, 'inventory_quantity', parseInt(this.value) || 0)"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Barcode</label>
                            <input
                                type="text"
                                class="form-input"
                                value="${variant.barcode || ''}"
                                placeholder="123456789"
                                onchange="window.variantsManager.updateVariant(${index}, 'barcode', this.value)"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Peso (kg)</label>
                            <input
                                type="number"
                                class="form-input"
                                value="${variant.weight || ''}"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                onchange="window.variantsManager.updateVariant(${index}, 'weight', parseFloat(this.value) || null)"
                            >
                        </div>
                    </div>
                    
                    <!-- Images Section -->
                    <div class="variant-images-section">
                        <div class="images-header">
                            <h4 class="images-title">🖼️ Immagini Variante</h4>
                            <button type="button" class="btn btn-outline btn-sm" onclick="window.variantsManager.toggleImagesSection(${index})">
                                <span id="toggle-images-${index}">▼ Mostra</span>
                            </button>
                        </div>
                        <div class="images-content" id="images-content-${index}" style="display: none;">
                            <div class="images-upload-zone"
                                 ondrop="window.variantsManager.handleImageDrop(event, ${index})"
                                 ondragover="window.variantsManager.handleImageDragOver(event)"
                                 ondragleave="window.variantsManager.handleImageDragLeave(event)"
                                 onclick="window.variantsManager.triggerImageUpload(${index})">
                                <div class="upload-icon">📤</div>
                                <div class="upload-text">Trascina immagini qui o clicca per selezionare</div>
                                <div class="upload-subtext">JPG, PNG, GIF, WEBP (max 5MB)</div>
                                <input type="file"
                                       id="image-input-${index}"
                                       multiple
                                       accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                       style="display: none;"
                                       onchange="window.variantsManager.handleImageSelect(event, ${index})">
                            </div>
                            <div class="images-gallery" id="images-gallery-${index}">
                                ${this.renderVariantImages(variant.images || [], index)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderVariantImages(images, variantIndex) {
        if (!images || images.length === 0) {
            return '<div class="no-images">Nessuna immagine caricata</div>';
        }
        
        return images.map((image, imageIndex) => `
            <div class="image-item" data-image-id="${image.id}">
                <div class="image-preview">
                    <img src="${image.src}" alt="${image.alt_text || ''}" loading="lazy">
                </div>
                <div class="image-info">
                    <div class="image-filename">${image.filename || 'Immagine'}</div>
                    <div class="image-size">${this.formatFileSize(image.size)}</div>
                </div>
                <div class="image-actions">
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.variantsManager.moveImageUp(${variantIndex}, ${imageIndex})" ${imageIndex === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.variantsManager.moveImageDown(${variantIndex}, ${imageIndex})" ${imageIndex === images.length - 1 ? 'disabled' : ''}>↓</button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="window.variantsManager.removeImage(${variantIndex}, ${imageIndex})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    toggleImagesSection(variantIndex) {
        const content = document.getElementById(`images-content-${variantIndex}`);
        const toggle = document.getElementById(`toggle-images-${variantIndex}`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲ Nascondi';
            // Load images if not already loaded
            this.loadVariantImages(variantIndex);
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼ Mostra';
        }
    }
    
    async loadVariantImages(variantIndex) {
        const variant = this.variants[variantIndex];
        if (!variant || !variant.id) return;
        
        try {
            const response = await fetch(`/api/variants/${variant.id}/images`);
            if (!response.ok) return;
            
            const result = await response.json();
            if (result.success) {
                variant.images = result.data || [];
                this.updateImagesGallery(variantIndex);
            }
        } catch (error) {
            console.error('Error loading variant images:', error);
        }
    }
    
    updateImagesGallery(variantIndex) {
        const gallery = document.getElementById(`images-gallery-${variantIndex}`);
        if (gallery) {
            gallery.innerHTML = this.renderVariantImages(this.variants[variantIndex].images || [], variantIndex);
        }
    }
    
    triggerImageUpload(variantIndex) {
        const input = document.getElementById(`image-input-${variantIndex}`);
        input.click();
    }
    
    handleImageSelect(event, variantIndex) {
        const files = Array.from(event.target.files);
        this.uploadImages(files, variantIndex);
    }
    
    handleImageDrop(event, variantIndex) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadZone = event.currentTarget;
        uploadZone.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            this.uploadImages(files, variantIndex);
        }
    }
    
    handleImageDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    }
    
    handleImageDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
    }
    
    async uploadImages(files, variantIndex) {
        const variant = this.variants[variantIndex];
        if (!variant.id) {
            this.showError('Salva prima la variante per caricare le immagini');
            return;
        }
        
        const formData = new FormData();
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showError(`File ${file.name} troppo grande (max 5MB)`);
                return;
            }
            formData.append('images', file);
        });
        
        try {
            this.showLoading(`Caricamento ${files.length} immagini...`);
            
            const response = await fetch(`/api/variants/${variant.id}/images/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                variant.images = variant.images || [];
                variant.images.push(...result.data);
                this.updateImagesGallery(variantIndex);
                this.showSuccess(`${result.count} immagini caricate con successo`);
            } else {
                this.showError(result.error || 'Errore durante il caricamento');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            this.showError('Errore durante il caricamento delle immagini');
        } finally {
            this.hideLoading();
        }
    }
    
    async removeImage(variantIndex, imageIndex) {
        const variant = this.variants[variantIndex];
        const image = variant.images[imageIndex];
        
        if (!image || !image.id) return;
        
        if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;
        
        try {
            const response = await fetch(`/api/variants/${variant.id}/images/${image.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                variant.images.splice(imageIndex, 1);
                this.updateImagesGallery(variantIndex);
                this.showSuccess('Immagine eliminata con successo');
            } else {
                this.showError(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('Error removing image:', error);
            this.showError('Errore durante l\'eliminazione dell\'immagine');
        }
    }
    
    async moveImageUp(variantIndex, imageIndex) {
        if (imageIndex === 0) return;
        
        const variant = this.variants[variantIndex];
        const image = variant.images[imageIndex];
        
        await this.updateImagePosition(variant.id, image.id, imageIndex);
        
        // Swap in local array
        [variant.images[imageIndex], variant.images[imageIndex - 1]] =
        [variant.images[imageIndex - 1], variant.images[imageIndex]];
        
        this.updateImagesGallery(variantIndex);
    }
    
    async moveImageDown(variantIndex, imageIndex) {
        const variant = this.variants[variantIndex];
        if (imageIndex === variant.images.length - 1) return;
        
        const image = variant.images[imageIndex];
        
        await this.updateImagePosition(variant.id, image.id, imageIndex + 2);
        
        // Swap in local array
        [variant.images[imageIndex], variant.images[imageIndex + 1]] =
        [variant.images[imageIndex + 1], variant.images[imageIndex]];
        
        this.updateImagesGallery(variantIndex);
    }
    
    async updateImagePosition(variantId, imageId, newPosition) {
        try {
            await fetch(`/api/variants/${variantId}/images/${imageId}/position`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: newPosition })
            });
        } catch (error) {
            console.error('Error updating image position:', error);
        }
    }
    
    showLoading(message) {
        // Implementation for loading indicator
        console.log('Loading:', message);
    }
    
    hideLoading() {
        // Implementation for hiding loading indicator
        console.log('Loading hidden');
    }
    
    showSuccess(message) {
        // Implementation for success notification
        console.log('Success:', message);
        if (window.showSuccess) {
            window.showSuccess(message);
        }
    }
    
    showError(message) {
        // Implementation for error notification
        console.error('Error:', message);
        if (window.showError) {
            window.showError(message);
        }
    }
    
    updateVariant(index, field, value) {
        if (this.variants[index]) {
            this.variants[index][field] = value;
        }
    }
    
    async loadVariants() {
        if (!this.productId) return;
        
        try {
            const response = await fetch(`/api/products/${this.productId}/variants`);
            if (!response.ok) return;
            
            const result = await response.json();
            this.variants = result.variants || [];
            this.renderVariants();
            this.updateGenerationStats();
            
        } catch (error) {
            console.error('Error loading variants:', error);
        }
    }
    
    openBulkEdit() {
        // Implementation for bulk edit modal
        console.log('Opening bulk edit for variants');
    }
    
    // Public methods for form integration
    setProductId(productId) {
        this.productId = productId;
        if (productId) {
            this.loadVariants();
        }
    }
    
    getOptionsData() {
        return this.options.filter(opt => opt.name && opt.values.length > 0);
    }
    
    getVariantsData() {
        return this.variants;
    }
    
    loadData(options = [], variants = []) {
        console.log('🔧 VariantsManager: loadData() called with', options.length, 'options and', variants.length, 'variants');
        
        // Disable offline mode when loading existing data
        if (options.length > 0 || variants.length > 0) {
            this.disableOfflineMode();
            console.log('🔧 VariantsManager: Disabled offline mode for existing data');
        }
        
        this.loadExistingOptions(options);
        this.loadExistingVariants(variants);
    }

    reset() {
        this.options = [];
        this.variants = [];
        this.variantCounter = 0;
        this.offlineMode = false;
        this.render();
        this.updateGenerationStats();
    }

    // Offline mode support for new products
    enableOfflineMode() {
        this.offlineMode = true;
        console.log('🔄 VariantsManager: Offline mode enabled');
    }

    disableOfflineMode() {
        this.offlineMode = false;
        console.log('🔄 VariantsManager: Offline mode disabled');
    }

    // Override setProductId to support offline mode
    setProductId(productId) {
        this.productId = productId;
        if (productId) {
            this.disableOfflineMode();
            this.loadVariants();
        }
    }

    // Load existing variants for editing
    loadExistingVariants(variants) {
        console.log('🔧 VariantsManager: loadExistingVariants() called with', variants.length, 'variants');
        console.log('🔧 VariantsManager: Raw variants data:', variants);
        
        this.variants = variants.map(variant => {
            const mappedVariant = {
                id: variant.id,
                sku: variant.sku || '',
                price: variant.price || 0,
                compare_at_price: variant.compare_at_price,
                inventory_quantity: variant.inventory_quantity || 0,
                weight: variant.weight,
                weight_unit: variant.weight_unit || 'kg',
                barcode: variant.barcode || '',
                selectedOptions: variant.selectedOptions || [],
                images: variant.images || []
            };
            console.log('🔧 VariantsManager: Mapped variant:', mappedVariant);
            return mappedVariant;
        });
        
        console.log('🔧 VariantsManager: Final variants array:', this.variants);
        this.renderVariants();
        this.updateGenerationStats();
        console.log('🔧 VariantsManager: loadExistingVariants() completed');
    }

    // Load existing options for editing
    loadExistingOptions(options) {
        console.log('🔧 VariantsManager: loadExistingOptions() called with', options.length, 'options');
        this.options = options.map(option => {
            let values = [];
            if (Array.isArray(option.values)) {
                values = option.values;
            } else if (typeof option.values === 'string') {
                values = option.values.split(',').map(v => v.trim()).filter(v => v);
            } else if (option.values) {
                // Handle other types by converting to string first
                values = String(option.values).split(',').map(v => v.trim()).filter(v => v);
            }
            
            return {
                id: option.id,
                name: option.name,
                position: option.position || this.options.length + 1,
                values: values
            };
        });
        this.renderOptions();
        this.updateGenerationStats();
        console.log('🔧 VariantsManager: loadExistingOptions() completed, options array:', this.options);
    }

    // Removed duplicate addOption method - using the main one at line 194

    // Get data for form submission
    getFormData() {
        const variants = this.getVariantsData().map(variant => {
            // Remove id for new variants (offline mode or variants without existing id)
            if (this.offlineMode || !variant.id) {
                const { id, ...variantWithoutId } = variant;
                return variantWithoutId;
            }
            return variant;
        });

        return {
            options: this.getOptionsData(),
            variants: variants,
            mode: this.mode,
            offlineMode: this.offlineMode
        };
    }

    // Validate that all variants have required fields
    validateVariants() {
        const errors = [];
        
        if (this.variants.length === 0) {
            errors.push('Almeno una variante è richiesta');
        }
        
        this.variants.forEach((variant, index) => {
            if (!variant.price || isNaN(variant.price) || variant.price <= 0) {
                errors.push(`Variante ${index + 1}: Prezzo richiesto (deve essere maggiore di 0)`);
            }
        });
        
        return errors;
    }
}

// Global instance
let variantsManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Will be initialized when needed
});