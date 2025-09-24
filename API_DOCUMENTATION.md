# API Documentation - Shopify Inventory Management

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently no authentication required (development mode).

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "data": object | array,
  "message": string (optional),
  "pagination": object (for paginated responses),
  "errors": array (for validation errors)
}
```

## Categories API

### GET /categories
List all categories with their fields.
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: 'active' | 'inactive'
- search: string
```

### GET /categories/:id
Get single category with fields.

### POST /categories
Create new category.
```json
{
  "name": "string (required)",
  "description": "string",
  "shopify_product_type": "string",
  "status": "active" | "inactive"
}
```

### PUT /categories/:id
Update category.

### DELETE /categories/:id
Delete category.

### POST /categories/:id/fields
Add field to category.
```json
{
  "name": "string (required)",
  "field_type": "string" | "number" | "boolean" | "date" | "text" | "select",
  "required": boolean,
  "position": number,
  "options": ["array", "for", "select", "type"],
  "default_value": "string"
}
```

### PUT /categories/:categoryId/fields/:fieldId
Update category field.

### DELETE /categories/:categoryId/fields/:fieldId
Delete category field.

## Products API

### GET /products
List all products with relations.
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: 'active' | 'archived' | 'draft'
- category_id: number
- search: string
```

### GET /products/:id
Get single product with all relations (category, variants, options, images, attributes).

### POST /products
Create new product.
```json
{
  "title": "string (required)",
  "description": "string",
  "vendor": "string",
  "product_type": "string",
  "tags": "string (comma-separated)",
  "handle": "string",
  "status": "active" | "archived" | "draft",
  "category_id": number
}
```

### PUT /products/:id
Update product.

### DELETE /products/:id
Delete product.

### POST /products/:id/variants
Add variant to product.
```json
{
  "sku": "string",
  "price": number (required),
  "compare_at_price": number,
  "option1": "string",
  "option2": "string",
  "option3": "string",
  "barcode": "string",
  "inventory_quantity": number,
  "inventory_management": "shopify" | "manual" | "none",
  "weight": number,
  "weight_unit": "g" | "kg" | "oz" | "lb"
}
```

### PUT /products/:productId/variants/:variantId
Update variant.

### DELETE /products/:productId/variants/:variantId
Delete variant.

## Images API

### GET /images
List images with filters.
```
Query Parameters:
- product_id: number
- variant_id: number
```

### GET /images/:id
Get single image.

### POST /images
Create image record.
```json
{
  "product_id": number (required),
  "variant_id": number,
  "src": "string (URL, required)",
  "alt_text": "string",
  "position": number,
  "width": number,
  "height": number,
  "size": number,
  "filename": "string"
}
```

### POST /images/upload
Upload single image file.
```
Form Data:
- image: File (required)
- product_id: number (required)
- variant_id: number
- alt_text: string
- position: number
```

### POST /images/upload-multiple
Upload multiple image files.
```
Form Data:
- images: File[] (required, max 10)
- product_id: number (required)
- variant_id: number
```

### PUT /images/:id
Update image.

### DELETE /images/:id
Delete image.

### PUT /images/:id/position
Update image position.
```json
{
  "position": number (required)
}
```

## Attributes API

### GET /attributes
List attributes with filters.
```
Query Parameters:
- product_id: number
- variant_id: number
- namespace: string
- category: string
```

### GET /attributes/:id
Get single attribute.

### POST /attributes
Create attribute.
```json
{
  "product_id": number (required),
  "variant_id": number,
  "category": "string",
  "key": "string (required)",
  "value": "string",
  "value_type": "string" | "number" | "boolean" | "date" | "json",
  "namespace": "string"
}
```

### PUT /attributes/:id
Update attribute.

### DELETE /attributes/:id
Delete attribute.

### GET /attributes/product/:productId
Get all attributes for a product (grouped by product/variants).

## Shopify API

### GET /shopify/test
Test Shopify connection.

### GET /shopify/rate-limit
Get Shopify API rate limit status.

### GET /shopify/preview/:productId
Preview product export data (no actual export).

### POST /shopify/export/:productId
Export product to Shopify.
```json
{
  "force": boolean (default: false)
}
```

### PUT /shopify/sync/:productId
Sync product from Shopify.

### DELETE /shopify/unlink/:productId
Unlink product from Shopify.
```json
{
  "deleteFromShopify": boolean (default: false)
}
```

### POST /shopify/bulk-export
Bulk export products to Shopify.
```json
{
  "product_ids": [1, 2, 3],
  "force": boolean (default: false)
}
```

## Error Codes

- **400**: Bad Request (validation errors)
- **404**: Not Found
- **500**: Internal Server Error

## File Upload

### Supported Image Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limits
- Maximum file size: 5MB per file
- Maximum files per request: 10

### Upload Directory
Files are stored in `/backend/uploads/` and served at `/uploads/:filename`

## Environment Variables

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

## Example Usage

### Create Category with Fields
```javascript
// 1. Create category
const category = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Electronics',
    description: 'Electronic devices',
    status: 'active'
  })
});

// 2. Add fields to category
await fetch(`/api/categories/${category.data.id}/fields`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Brand',
    field_type: 'string',
    required: true,
    position: 1
  })
});
```

### Create Product with Variants
```javascript
// 1. Create product
const product = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Smartphone',
    description: 'Latest smartphone',
    category_id: 1,
    status: 'active'
  })
});

// 2. Add variant
await fetch(`/api/products/${product.data.id}/variants`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sku: 'PHONE-001',
    price: 999.99,
    option1: 'Black',
    option2: '128GB',
    inventory_quantity: 50
  })
});
```

### Upload and Associate Image
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('product_id', '1');
formData.append('alt_text', 'Product image');

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData
});
```

### Export to Shopify
```javascript
// Preview export
const preview = await fetch('/api/shopify/preview/1');

// Actual export
const exportResult = await fetch('/api/shopify/export/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ force: false })
});