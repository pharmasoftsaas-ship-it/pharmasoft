# API Documentation

## Authentication

All API routes require authentication via Supabase Auth. The user must be logged in and have a valid session.

## API Endpoints

### Sales

#### `POST /api/sales/create`
Create a new sale with automatic FIFO batch selection and stock deduction.

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "uuid",
      "qty": 2,
      "unit_price": 10.50
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "sale_id": "uuid"
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid items or insufficient stock
- `500` - Server error

---

### Products

#### `GET /api/products/find_by_barcode?code=xxxx`
Find a product by barcode and get recommended FIFO batch.

**Query Parameters:**
- `code` (required) - Barcode string

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "sku": "SKU123",
    "barcode": "1234567890"
  },
  "batch": {
    "id": "uuid",
    "batch_no": "BATCH001",
    "available_qty": 10,
    "sale_price": 15.00,
    "expiry_date": "2024-12-31"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Product not found or no stock available

---

### Purchases

#### `POST /api/purchases/create`
Create a new purchase and create/update stock batches.

**Request Body:**
```json
{
  "supplier_name": "Supplier Name",
  "items": [
    {
      "product_id": "uuid",
      "batch_no": "BATCH001",
      "qty": 50,
      "purchase_price": 10.00,
      "sale_price": 15.00,
      "expiry_date": "2024-12-31"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "purchase_id": "uuid"
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid purchase data
- `500` - Server error

---

### Inventory

#### `GET /api/inventory/levels`
Get inventory levels with optional filters.

**Query Parameters:**
- `low_stock` (optional) - Filter low stock items (true/false)
- `near_expiry` (optional) - Filter near expiry items (true/false)
- `product_id` (optional) - Filter by specific product

**Response:**
```json
{
  "data": [
    {
      "product_id": "uuid",
      "product_name": "Product Name",
      "sku": "SKU123",
      "barcode": "1234567890",
      "total_stock": 100,
      "batches": [
        {
          "batch_id": "uuid",
          "batch_no": "BATCH001",
          "qty_on_hand": 50,
          "purchase_price": 10.00,
          "sale_price": 15.00,
          "expiry_date": "2024-12-31"
        }
      ]
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `500` - Server error

---

### Reports

#### `GET /api/reports/generate?period=daily|weekly|monthly`
Generate sales and inventory reports.

**Query Parameters:**
- `period` (required) - Report period: `daily`, `weekly`, or `monthly`

**Response:**
```json
{
  "total_sales": 150,
  "revenue": 2250.00,
  "profit": 750.00,
  "units_sold": 150,
  "top_products": [
    {
      "name": "Product Name",
      "qty": 50
    }
  ],
  "inventory_valuation": 5000.00,
  "expiring_items": 5
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid period

---

### Accounting

#### `POST /api/accounting/entry`
Create an accounting entry (income or expense).

**Request Body:**
```json
{
  "type": "income",
  "category": "Services",
  "amount": 500.00,
  "note": "Consultation fees"
}
```

**Response:**
```json
{
  "success": true,
  "entry_id": "uuid"
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid entry data
- `500` - Server error

---

### Settings

#### `POST /api/settings/update_expiry_threshold`
Update the expiry notification threshold for the tenant.

**Request Body:**
```json
{
  "near_expiry_days": 14
}
```

**Response:**
```json
{
  "success": true
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid threshold (must be 1-180)
- `500` - Server error

---

## Database Functions (Supabase RPC)

### `get_fifo_batch(p_tenant_id, p_product_id, p_qty)`
Get the FIFO batch for a product (earliest expiry).

**Parameters:**
- `p_tenant_id` (UUID) - Tenant ID
- `p_product_id` (UUID) - Product ID
- `p_qty` (INTEGER) - Quantity needed

**Returns:**
```json
[
  {
    "batch_id": "uuid",
    "batch_no": "BATCH001",
    "available_qty": 10,
    "purchase_price": 10.00,
    "sale_price": 15.00,
    "expiry_date": "2024-12-31"
  }
]
```

### `deduct_stock(p_batch_id, p_qty)`
Deduct stock from a batch.

**Parameters:**
- `p_batch_id` (UUID) - Batch ID
- `p_qty` (INTEGER) - Quantity to deduct

**Returns:**
- `true` - Success
- `false` - Insufficient stock

### `check_expiring_batches()`
Check for expiring batches and create notifications. Called by cron job.

**Returns:**
- `void`

---

## Edge Functions

### `expiry-check`
Supabase Edge Function called by cron job to check for expiring batches.

**Endpoint:** `https://your-project.supabase.co/functions/v1/expiry-check`

**Method:** `POST`

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

**Response:**
```json
{
  "success": true,
  "message": "Expiry check completed"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not logged in)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## CORS

CORS is handled by Next.js middleware. All API routes are accessible from the same origin.

