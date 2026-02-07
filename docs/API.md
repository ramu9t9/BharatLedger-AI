# BharatLedger API

Base URL: `/api/v1` (or full origin when deployed).

## Auth

- **POST** `/auth/signup` — Body: `{ "email", "password", "full_name" }` → `{ "id", "email" }`
- **POST** `/auth/login` — Body: `{ "email", "password" }` → `{ "access_token", "token_type" }`

Use header: `Authorization: Bearer <access_token>` for protected routes.

## Businesses

- **GET** `/businesses` → list of `{ id, name, gstin, business_type, address }`
- **POST** `/businesses` — Body: `{ "name", "gstin?", "business_type?", "address?" }`
- **GET** `/businesses/{id}` → single business

## Invoices

- **POST** `/invoices` — Form: `business_id`, `file` (image/PDF) → invoice (processing may be sync or async)
- **GET** `/invoices` — Query: `business_id?` → list of invoices
- **GET** `/invoices/{id}` → single invoice with `extracted_json`
- **PATCH** `/invoices/{id}` — Body: `{ "extracted_json?", "status?" }`
- **POST** `/invoices/{id}/process` → re-run extraction, returns updated invoice

Invoice `status`: `UPLOADED | PROCESSING | EXTRACTED | NEEDS_REVIEW | FAILED`.

## Reports

- **GET** `/reports/pl` — Query: `business_id?`, `period_start?`, `period_end?` → P&L summary
- **GET** `/reports/expenses` — Query: `business_id?` → expense breakdown by category

## GST

- **GET** `/gst/businesses/{business_id}/liability` → `{ output_tax, itc, tax_payable }`
- **POST** `/gst/gstr1/prepare` — Body: `{ "business_id", "period?" }` → GSTR-1 style JSON
- **POST** `/gst/gstr3b/prepare` — Body: `{ "business_id", "period?" }` → GSTR-3B style JSON

## Health

- **GET** `/health` → `{ "status": "ok" }`
