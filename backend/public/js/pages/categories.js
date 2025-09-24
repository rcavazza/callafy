
/**
 * Categories Page - Complete Implementation
 * Manages category listing, creation, editing, deletion, and custom fields
 */

class CategoriesPage {
    constructor() {
        this.categories = [];
        this.currentCategory = null;
        this.loading = false;
        this.initialized = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.limit = 10;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.searchQuery = '';
        this.statusFilter = '';
        this.selectedCategories = new Set();
    }

    /**
     * Initialize the categories page
     */
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🏷️ Initializing Categories page');
            
            // Set loading state
            this.setLoading(true);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load categories data
            await this.loadCategories();
            
            this.initialized = true;
            this.setLoading(false);
            
            console.log('✅ Categories page initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing categories page:', error);
            notifications.error('Errore', 'Impossibile inizializzare la pagina categorie');
            this.setLoading(false);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Add category buttons
        document.getElementById('add-category-btn')?.addEventListener('click', () => this.openCategoryModal());
        document.getElementById('add-category-empty-btn')?.addEventListener('click', () => this.openCategoryModal());

        // Search input with debounce
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.loadCategories();
            }, 300));
        }

        // Status filter
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.currentPage = 1;
            this.loadCategories();
        });

        // Bulk actions
        document.getElementById('bulk-actions')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.handleBulkAction(e.target.value);
                e.target.value = '';
            }
        });

        // Select all checkbox
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Sort headers
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                this.handleSort(field);
            });
        });

        // Category modal events
        this.setupModalEvents();

        // Pagination events
        this.setupPaginationEvents();
    }

    /**
     * Setup modal event listeners
     */
    setupModalEvents() {
        // Category modal
        document.getElementById('cancel-category-btn')?.addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('category-form')?.addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Fields modal
        document.getElementById('close-fields-btn')?.addEventListener('click', () => this.closeFieldsModal());
        document.getElementById('add-field-btn')?.addEventListener('click', () => this.addFieldRow());

        // Close modals on backdrop click
        document.getElementById('category-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'category-modal') this.closeCategoryModal();
        });
        document.getElementById('fields-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'fields-modal') this.closeFieldsModal();
        });
    }

    /**
     * Setup pagination event listeners
     */
    setupPaginationEvents() {
        document.getElementById('prev-mobile')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        document.getElementById('next-mobile')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        try {
            this.setLoading(true);
            
            const params = {
                page: this.currentPage,
                limit: this.limit
            };

            if (this.searchQuery) params.search = this.searchQuery;
            if (this.statusFilter) params.status = this.statusFilter;

            console.log('📥 Loading categories with params:', params);
            
            const response = await api.getCategories(params);
            this.categories = response.data || [];
            
            // Update pagination info
            if (response.pagination) {
                this.totalPages = response.pagination.pages;
                this.totalItems = response.pagination.total;
            }
            
            console.log(`✅ Loaded ${this.categories.length} categories`);
            
            // Update UI
            this.renderCategories();
            this.updatePagination();
            this.updateBulkActionsState();
            
        } catch (error) {
            console.error('❌ Error loading categories:', error);
            notifications.error('Errore', 'Impossibile caricare le categorie');
            this.showEmptyState();
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Render categories table
     */
    renderCategories() {
        const tbody = document.getElementById('categories-tbody');
        const tableContainer = document.getElementById('categories-table-container');
        const emptyState = document.getElementById('categories-empty');

        if (!tbody) return;

        if (this.categories.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';

        tbody.innerHTML = this.categories.map(category => this.createCategoryRow(category)).join('');

        // Add event listeners to action buttons
        this.bindRowEvents();
    }

    /**
     * Create a category table row
     */
    createCategoryRow(category) {
        const statusClass = category.status === 'active' ? 'badge-success' : 'badge-secondary';
        const statusText = category.status === 'active' ? 'Attiva' : 'Inattiva';
        const fieldsCount = category.fields ? category.fields.length : 0;

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="category-checkbox rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                           data-id="${category.id}" ${this.selectedCategories.has(category.id) ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${utils.escapeHtml(category.name)}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${utils.escapeHtml(category.description || '-')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${utils.escapeHtml(category.shopify_product_type || '-')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-sm text-primary-600 hover:text-primary-900 manage-fields-btn" data-id="${category.id}">
                        ${fieldsCount} campo${fieldsCount !== 1 ? 'i' : ''}
                    </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center space-x-2">
                        <button class="text-primary-600 hover:text-primary-900 edit-btn" data-id="${category.id}" title="Modifica">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${category.id}" title="Elimina">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Bind events to table row elements
     */
    bindRowEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.editCategory(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.deleteCategory(id);
            });
        });

        // Manage fields buttons
        document.querySelectorAll('.manage-fields-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.manageFields(id);
            });
        });

        // Category checkboxes
        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (e.target.checked) {
                    this.selectedCategories.add(id);
                } else {
                    this.selectedCategories.delete(id);
                }
                this.updateBulkActionsState();
                this.updateSelectAllState();
            });
        });
    }

    /**
     * Open category modal for creation or editing
     */
    openCategoryModal(category = null) {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('category-form');

        if (!modal || !title || !form) return;

        this.currentCategory = category;

        if (category) {
            title.textContent = 'Modifica Categoria';
            this.populateCategoryForm(category);
        } else {
            title.textContent = 'Nuova Categoria';
            form.reset();
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close category modal
     */
    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.currentCategory = null;
            this.clearFormErrors();
        }
    }

    /**
     * Populate category form with data
     */
    populateCategoryForm(category) {
        document.getElementById('category-name').value = category.name || '';
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-shopify-type').value = category.shopify_product_type || '';
        document.getElementById('category-status').value = category.status || 'active';
    }

    /**
     * Handle category form submission
     */
    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            this.setSubmitLoading(true);

            if (this.currentCategory) {
                await api.updateCategory(this.currentCategory.id, data);
                notifications.success('Successo', 'Categoria aggiornata con successo');
            } else {
                await api.createCategory(data);
                notifications.success('Successo', 'Categoria creata con successo');
            }

            this.closeCategoryModal();
            await this.loadCategories();

        } catch (error) {
            console.error('Error saving category:', error);
            this.handleFormError(error);
        } finally {
            this.setSubmitLoading(false);
        }
    }

    /**
     * Edit category
     */
    async editCategory(id) {
        try {
            const category = await api.getCategory(id);
            this.openCategoryModal(category);
        } catch (error) {
            console.error('Error loading category:', error);
            notifications.error('Errore', 'Impossibile caricare la categoria');
        }
    }

    /**
     * Delete category with confirmation
     */
    async deleteCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        if (!confirm(`Sei sicuro di voler eliminare la categoria "${category.name}"?`)) {
            return;
        }

        try {
            await api.deleteCategory(id);
            notifications.success('Successo', 'Categoria eliminata con successo');
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            notifications.error('Errore', 'Impossibile eliminare la categoria');
        }
    }

    /**
     * Manage category fields
     */
    async manageFields(id) {
        try {
            const category = await api.getCategory(id);
            this.openFieldsModal(category);
        } catch (error) {
            console.error('Error loading category fields:', error);
            notifications.error('Errore', 'Impossibile caricare i campi della categoria');
        }
    }

    /**
     * Open fields management modal
     */
    openFieldsModal(category) {
        const modal = document.getElementById('fields-modal');
        const title = document.getElementById('fields-modal-title');

        if (!modal || !title) return;

        this.currentCategory = category;
        title.textContent = `Campi Personalizzati - ${category.name}`;

        this.renderFields(category.fields || []);

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close fields modal
     */
    closeFieldsModal() {
        const modal = document.getElementById('fields-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.currentCategory = null;
        }
    }

    /**
     * Render category fields
     */
    renderFields(fields) {
        const container = document.getElementById('fields-list');
        if (!container) return;

        if (fields.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>Nessun campo personalizzato configurato</p>
                    <p class="text-sm">Clicca "Aggiungi Campo" per iniziare</p>
                </div>
            `;
            return;
        }

        container.innerHTML = fields.map(field => this.createFieldRow(field)).join('');
        this.bindFieldEvents();
    }

    /**
     * Create field row HTML
     */
    createFieldRow(field) {
        const fieldTypes = {
            'string': 'Testo',
            'number': 'Numero',
            'boolean': 'Booleano',
            'date': 'Data',
            'text': 'Testo Lungo',
            'select': 'Selezione'
        };

        return `
            <div class="field-row border rounded-lg p-4 bg-gray-50" data-id="${field.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700">Nome Campo</label>
                                <input type="text" class="field-name mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" 
                                       value="${utils.escapeHtml(field.name)}" />
                            </div>
                            <div class="w-32">
                                <label class="block text-sm font-medium text-gray-700">Tipo</label>
                                <select class="field-type mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    ${Object.entries(fieldTypes).map(([value, label]) => 
                                        `<option value="${value}" ${field.field_type === value ? 'selected' : ''}>${label}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" class="field-required rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                                       ${field.required ? 'checked' : ''} />
                                <label class="ml-2 text-sm text-gray-700">Obbligatorio</label>
                            </div>
                        </div>
                        ${field.field_type === 'select' ? this.createOptionsInput(field.options) : ''}
                    </div>
                    <div class="ml-4 flex items-center space-x-2">
                        <button class="save-field-btn text-green-600 hover:text-green-900" data-id="${field.id}" title="Salva">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button class="delete-field-btn text-red-600 hover:text-red-900" data-id="${field.id}" title="Elimina">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create options input for select fields
     */
    createOptionsInput(options = []) {
        return `
            <div class="mt-2 options-container">
                <label class="block text-sm font-medium text-gray-700">Opzioni (una per riga)</label>
                <textarea class="field-options mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" 
                          rows="3" placeholder="Opzione 1\nOpzione 2\nOpzione 3">${options.join('\n')}</textarea>
            </div>
        `;
    }

    /**
     * Add new field row
     */
    addFieldRow() {
        const newField = {
            id: 'new-' + Date.now(),
            name: '',
            field_type: 'string',
            required: false,
            options: []
        };

        const container = document.getElementById('fields-list');
        if (!container) return;

        // If empty state, clear it
        if (container.querySelector('.text-center')) {
            container.innerHTML = '';
        }

        container.insertAdjacentHTML('beforeend', this.createFieldRow(newField));
        this.bindFieldEvents();
    }

    /**
     * Bind events to field elements
     */
    bindFieldEvents() {
        // Save field buttons
        document.querySelectorAll('.save-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.saveField(id);
            });
        });

        // Delete field buttons
        document.querySelectorAll('.delete-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteField(id);
            });
        });

        // Field type change
        document.querySelectorAll('.field-type').forEach(select => {
            select.addEventListener('change', (e) => {
                const row = e.target.closest('.field-row');
                const optionsContainer = row.querySelector('.options-container');
                
                if (e.target.value === 'select') {
                    if (!optionsContainer) {
                        const container = row.querySelector('.flex-1');
                        container.insertAdjacentHTML('beforeend', this.createOptionsInput());
                    }
                } else {
                    if (optionsContainer) {
                        optionsContainer.remove();
                    }
                }
            });
        });
    }

    /**
     * Save field
     */
    async saveField(id) {
        const row = document.querySelector(`[data-id="${id}"]`);
        if (!row) return;

        const data = {
            name: row.querySelector('.field-name').value,
            field_type: row.querySelector('.field-type').value,
            required: row.querySelector('.field-required').checked
        };

        if (data.field_type === 'select') {
            const optionsText = row.querySelector('.field-options')?.value || '';
            data.options = optionsText.split('\n').filter(opt => opt.trim());
        }

        try {
            if (id.startsWith('new-')) {
                await api.createCategoryField(this.currentCategory.id, data);
                notifications.success('Successo', 'Campo aggiunto con successo');
            } else {
                await api.updateCategoryField(this.currentCategory.id, id, data);
                notifications.success('Successo', 'Campo aggiornato con successo');
            }

            // Reload category data
            const category = await api.getCategory(this.currentCategory.id);
            this.renderFields(category.fields || []);

        } catch (error) {
            console.error('Error saving field:', error);
            notifications.error('Errore', 'Impossibile salvare il campo');
        }
    }

    /**
     * Delete field
     */
    async deleteField(id) {
        if (!confirm('Sei sicuro di voler eliminare questo campo?')) {
            return;
        }

        try {
            if (id.startsWith('new-')) {
                // Just remove the row for new fields
                document.querySelector(`[data-id="${id}"]`).remove();
            } else {
                await api.deleteCategoryField(this.currentCategory.id, id);
                notifications.success('Successo', 'Campo eliminato con successo');
                
                // Reload category data
                const category = await api.getCategory(this.currentCategory.id);
                this.renderFields(category.fields || []);
            }
        } catch (error) {
            console.error('Error deleting field:', error);
            notifications.error('Errore', 'Impossibile eliminare il campo');
        }
    }

    /**
     * Handle sorting
     */
    handleSort(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }

        this.currentPage = 1;
        this.loadCategories();
    }

    /**
     * Handle bulk actions
     */
    async handleBulkAction(action) {
        if (this.selectedCategories.size === 0) {
            notifications.warning('Attenzione', 'Seleziona almeno una categoria');
            return;
        }

        const selectedIds = Array.from(this.selectedCategories);
        let confirmMessage = '';

        switch (action) {
            case 'activate':
                confirmMessage = `Attivare ${selectedIds.length} categorie selezionate?`;
                break;
            case 'deactivate':
                confirmMessage = `Disattivare ${selectedIds.length} categorie selezionate?`;
                break;
            case 'delete':
                confirmMessage = `Eliminare ${selectedIds.length} categorie selezionate? Questa azione non può essere annullata.`;
                break;
        }

        if (!confirm(confirmMessage)) return;

        try {
            const promises = selectedIds.map(id => {
                switch (action) {
                    case 'activate':
                        return api.updateCategory(id, { status: 'active' });
                    case 'deactivate':
                        return api.updateCategory(id, { status: 'inactive' });
                    case 'delete':
                        return api.deleteCategory(id);
                }
            });

            await Promise.all(promises);
            
            notifications.success('Successo', `Operazione completata su ${selectedIds.length} categorie`);
            this.selectedCategories.clear();
            await this.loadCategories();

        } catch (error) {
            console.error('Error in bulk action:', error);
            notifications.error('Errore', 'Errore durante l\'operazione multipla');
        }
    }

    /**
     * Toggle select all categories
     */
    toggleSelectAll(checked) {
        this.selectedCategories.clear();
        
        if (checked) {
            this.categories.forEach(category => {
                this.selectedCategories.add(category.id);
            });
        }

        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });

        this.updateBulkActionsState();
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        const selectAll = document.getElementById('select-all');
        if (!selectAll) return;

        const totalVisible = this.categories.length;
        const selectedVisible = this.categories.filter(c => this.selectedCategories.has(c.id)).length;

        if (selectedVisible === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (selectedVisible === totalVisible) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }
    }

    /**
     * Update bulk actions dropdown state
     */
    updateBulkActionsState() {
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            bulkActions.disabled = this.selectedCategories.size === 0;
        }
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadCategories();
    }

    /**
     * Update pagination UI
     */
    updatePagination() {
        // Update info text
        const showingFrom = document.getElementById('showing-from');
        const showingTo = document.getElementById('showing-to');
        const totalItems = document.getElementById('total-items');

        if (showingFrom && showingTo && totalItems) {
            const from = (this.currentPage - 1) * this.limit + 1;
            const to = Math.min(this.currentPage * this.limit, this.totalItems);
            
            showingFrom.textContent = this.totalItems > 0 ? from : 0;
            showingTo.textContent = to;
            totalItems.textContent = this.totalItems;
        }

        // Update mobile buttons
        const prevMobile = document.getElementById('prev-mobile');
        const nextMobile = document.getElementById('next-mobile');

        if (prevMobile) prevMobile.disabled = this.currentPage <= 1;
        if (nextMobile) nextMobile.disabled = this.currentPage >= this.totalPages;

        // Update desktop pagination
        this.renderPaginationButtons();
    }

    /**
     * Render pagination buttons
     */
    renderPaginationButtons() {
        const nav = document.getElementById('pagination-nav');
        if (!nav) return;

        let buttons = [];

        // Previous button
        buttons.push(`
            <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage <= 1 ? 'cursor-not-allowed opacity-50' : ''}"
                    ${this.currentPage <= 1 ? 'disabled' : ''} onclick="window.categoriesPage.goToPage(${this.currentPage - 1})">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        `);

        // Page numbers
        const maxVisible = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            buttons.push(`
                <button class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isActive
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }" onclick="window.categoriesPage.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        // Next button
        buttons.push(`
            <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage >= this.totalPages ? 'cursor-not-allowed opacity-50' : ''}"
                    ${this.currentPage >= this.totalPages ? 'disabled' : ''} onclick="window.categoriesPage.goToPage(${this.currentPage + 1})">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        `);

        nav.innerHTML = buttons.join('');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const tableContainer = document.getElementById('categories-table-container');
        const emptyState = document.getElementById('categories-empty');

        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.loading = loading;
        state.set('loading', loading);

        const loadingEl = document.getElementById('categories-loading');
        const contentEl = document.getElementById('categories-table-container');

        if (loadingEl && contentEl) {
            if (loading) {
                loadingEl.style.display = 'flex';
                contentEl.style.display = 'none';
            } else {
                loadingEl.style.display = 'none';
                contentEl.style.display = 'block';
            }
        }
    }

    /**
     * Set submit loading state
     */
    setSubmitLoading(loading) {
        const submitBtn = document.getElementById('save-category-btn');
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="spinner w-4 h-4 mr-2"></div>Salvando...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Salva';
            }
        }
    }

    /**
     * Handle form errors
     */
    handleFormError(error) {
        if (error.response && error.response.data && error.response.data.error) {
            notifications.error('Errore di Validazione', error.response.data.error);
        } else {
            notifications.error('Errore', 'Impossibile salvare la categoria');
        }
    }

    /**
     * Clear form errors
     */
    clearFormErrors() {
        document.querySelectorAll('.form-error-message').forEach(el => {
            el.textContent = '';
        });
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('form-error');
        });
    }

    /**
     * Cleanup when leaving the page
     */
    cleanup() {
        console.log('🧹 Cleaning up categories page');
        this.initialized = false;
        this.selectedCategories.clear();
    }

    /**
     * Handle page refresh
     */
    async refresh() {
        console.log('🔄 Refreshing categories page');
        await this.loadCategories();
    }

    /**
     * Get selected categories
     */
    getSelectedCategories() {
        return Array.from(this.selectedCategories);
    }

    /**
     * Get current categories
     */
    getCategories() {
        return [...this.categories];
    }
}

// Create global instance
window.categoriesPage = new CategoriesPage();

// Force initialization when page is loaded directly (not via SPA routing)
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the categories page
    if (window.location.pathname === '/categories') {
        console.log('🏷️ Direct access to categories page - forcing initialization');
        window.categoriesPage.init();
    }
});

// Also initialize if already loaded and we're on categories page
if (document.readyState === 'complete' && window.location.pathname === '/categories') {
    console.log('🏷️ Page already loaded - initializing categories');
    window.categoriesPage.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.categoriesPage) {
        window.categoriesPage.cleanup();
    }
});