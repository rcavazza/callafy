const { Category, CategoryField } = require('../models');

async function seedCategories() {
    try {
        console.log('🌱 Seeding categories...');

        // Ensure database is synced
        const { sequelize } = require('../models');
        await sequelize.sync();

        // Clear existing categories (with proper error handling)
        try {
            await CategoryField.destroy({ where: {} });
        } catch (error) {
            console.log('No category fields to clear');
        }
        
        try {
            await Category.destroy({ where: {} });
        } catch (error) {
            console.log('No categories to clear');
        }

        // Create sample categories
        const categories = [
            {
                name: 'Abbigliamento',
                description: 'Vestiti e accessori di moda',
                shopify_product_type: 'Apparel & Accessories',
                status: 'active'
            },
            {
                name: 'Elettronica',
                description: 'Dispositivi elettronici e gadget tecnologici',
                shopify_product_type: 'Electronics',
                status: 'active'
            },
            {
                name: 'Casa e Giardino',
                description: 'Articoli per la casa e il giardinaggio',
                shopify_product_type: 'Home & Garden',
                status: 'active'
            },
            {
                name: 'Sport e Tempo Libero',
                description: 'Attrezzature sportive e per il tempo libero',
                shopify_product_type: 'Sports & Recreation',
                status: 'inactive'
            },
            {
                name: 'Libri e Media',
                description: 'Libri, film, musica e media digitali',
                shopify_product_type: 'Media',
                status: 'active'
            }
        ];

        const createdCategories = [];
        for (const categoryData of categories) {
            const category = await Category.create(categoryData);
            createdCategories.push(category);
            console.log(`✅ Created category: ${category.name}`);
        }

        // Add some custom fields to categories
        const fields = [
            // Abbigliamento fields
            {
                category_id: createdCategories[0].id,
                name: 'Taglia',
                field_type: 'select',
                required: true,
                position: 1,
                options: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
            },
            {
                category_id: createdCategories[0].id,
                name: 'Colore',
                field_type: 'string',
                required: true,
                position: 2
            },
            {
                category_id: createdCategories[0].id,
                name: 'Materiale',
                field_type: 'string',
                required: false,
                position: 3
            },
            // Elettronica fields
            {
                category_id: createdCategories[1].id,
                name: 'Brand',
                field_type: 'string',
                required: true,
                position: 1
            },
            {
                category_id: createdCategories[1].id,
                name: 'Modello',
                field_type: 'string',
                required: true,
                position: 2
            },
            {
                category_id: createdCategories[1].id,
                name: 'Garanzia (mesi)',
                field_type: 'number',
                required: false,
                position: 3,
                default_value: '12'
            },
            {
                category_id: createdCategories[1].id,
                name: 'Ricondizionato',
                field_type: 'boolean',
                required: false,
                position: 4,
                default_value: 'false'
            },
            // Casa e Giardino fields
            {
                category_id: createdCategories[2].id,
                name: 'Ambiente',
                field_type: 'select',
                required: true,
                position: 1,
                options: JSON.stringify(['Cucina', 'Bagno', 'Soggiorno', 'Camera da letto', 'Giardino', 'Terrazzo'])
            },
            {
                category_id: createdCategories[2].id,
                name: 'Dimensioni',
                field_type: 'string',
                required: false,
                position: 2
            }
        ];

        for (const fieldData of fields) {
            const field = await CategoryField.create(fieldData);
            console.log(`✅ Created field: ${field.name} for category ${createdCategories.find(c => c.id === field.category_id).name}`);
        }

        console.log(`🎉 Successfully seeded ${createdCategories.length} categories with ${fields.length} custom fields`);
        return createdCategories;

    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }
}

module.exports = { seedCategories };

// Run if called directly
if (require.main === module) {
    const { sequelize } = require('../models');
    
    seedCategories()
        .then(() => {
            console.log('✅ Categories seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Categories seeding failed:', error);
            process.exit(1);
        });
}