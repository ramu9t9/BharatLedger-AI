# BharatLedger AI — Implementation Roadmap & Plan

**Last updated:** 2026-02-07  
**Status:** Project scaffold complete; implementation not started.  
**Reference:** `PROJECT_OVERVIEW.md`, `START_HERE.md`

---

## 1. Project Understanding (Summary)

### 1.1 What It Is
**BharatLedger AI** is an AI-powered accounting assistant for **Indian MSMEs**. It reduces manual work and CA dependency by:

- **Reading invoices** in any language/format (OCR + AI)
- **Categorizing expenses** with correct GST rates and learning from corrections
- **Preparing GST returns** (GSTR-1, GSTR-3B) with validation
- **Providing reports** (P&L, GST liability, expense breakdown) in simple language
- **Sending alerts** (filing deadlines, anomalies, savings)

### 1.2 Target Users & Market
- **Primary:** Indian MSMEs (63M+; 5M+ digitized and addressable)
- **Pain:** GST compliance complexity, manual expense entry, invoice chaos, high CA cost (₹5K–₹15K/month)
- **Differentiation:** Indian-first (regional languages, local formats), AI-first (learns from corrections), mobile-first (WhatsApp, photo upload)

### 1.3 Current Repository State
| Area        | Status        | Contents                          |
|------------|---------------|------------------------------------|
| **Root**   | Defined       | README, PROJECT_OVERVIEW, START_HERE, .env.example, .gitignore |
| **backend/** | Empty (scaffold) | `.gitkeep` only — FastAPI to be created |
| **frontend/** | Empty (scaffold) | `.gitkeep` only — React to be created |
| **ai_engine/** | Empty (scaffold) | `.gitkeep` only — OCR/AI/GST logic to be created |
| **docs/**  | Empty (scaffold) | `.gitkeep` only — API, GST rules, deployment docs to be added |

No application code, database, or deployment pipelines exist yet.

### 1.4 Technology Stack (Recap)
- **Backend:** Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy 2.0, Celery + Redis, JWT auth
- **AI/OCR:** OpenAI/OpenRouter (LLM), Tesseract 5, Google Vision (optional), EasyOCR (fallback)
- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Infra:** Docker, S3-compatible storage, GitHub Actions (CI/CD)

---

## 2. Implementation Phases (Overview)

Implementation is split into **six phases** over roughly **12 weeks**, with clear inputs/outputs and success criteria.

| Phase | Focus | Duration | Outcome |
|-------|--------|----------|---------|
| **0** | Prerequisites & project setup | Before Week 1 | Dev environment, env vars, DB/Redis/S3 access |
| **1** | Core AI engine | Week 1–2 | InvoiceProcessor, GST calculator, category mapping, tests |
| **2** | Backend API | Week 3–4 | FastAPI app, DB models, upload/process APIs, auth |
| **3** | Frontend MVP | Week 5–6 | React app, auth UI, upload, invoice list/detail, dashboard |
| **4** | Reports & GST returns | Week 7–8 | P&L, GST liability, GSTR-1/3B JSON generation |
| **5** | Polish & testing | Week 9–10 | E2E tests, validation, error handling, docs |
| **6** | Launch prep | Week 11–12 | Production deploy, monitoring, first users |

---

## 3. Phase 0 — Prerequisites & Project Setup

**Goal:** Any developer can clone the repo and run backend + workers + DB + Redis without application code.

### 3.1 Tasks
- [ ] **Environment**
  - Copy `.env.example` → `.env`
  - Set `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
  - Optionally set `GOOGLE_APPLICATION_CREDENTIALS` / `GOOGLE_VISION_PROJECT_ID` for Vision API
  - Set `DATABASE_URL`, `REDIS_URL` (local or Docker)
  - Set `SECRET_KEY`, `S3_*` or use MinIO/localstack for dev
- [ ] **Local services**
  - PostgreSQL 15+ (local or Docker)
  - Redis (local or Docker)
  - Optional: MinIO or S3-compatible bucket for invoice storage
- [ ] **Repo**
  - Create Python venv: `python -m venv venv`
  - Backend deps: add `backend/requirements.txt` and install (FastAPI, uvicorn, sqlalchemy, alembic, redis, celery, python-dotenv, pydantic, etc.)
  - Root `docker-compose.yml`: PostgreSQL + Redis (and optionally MinIO) for local dev
- [ ] **Docs**
  - Add `docs/SETUP.md` with step-by-step setup (clone, venv, env, docker-compose up, migrate)

### 3.2 Success Criteria
- `docker-compose up -d` brings up Postgres and Redis
- `.env` is loaded without errors
- No application code required to validate Phase 0

---

## 4. Phase 1 — Core AI Engine (Week 1–2)

**Goal:** Standalone, testable modules for invoice text extraction, GST calculation, and expense categorization. No FastAPI or DB yet.

**Location:** `ai_engine/`

### 4.1 Dependencies
- Phase 0 done (env, API keys)
- Python 3.11+ with: `requests`, `openai` (or openrouter client), `pytesseract`, `pdf2image`, `Pillow`, optional `google-cloud-vision`, `easyocr`

### 4.2 Tasks (Ordered)

| # | Task | Deliverable | Priority |
|---|------|-------------|----------|
| 1.1 | **GST rates & rules** | `ai_engine/gst_rates.py`: constants (0, 5, 12, 18, 28%), CGST/SGST/IGST logic, reverse charge, composition | P0 |
| 1.2 | **GST calculator** | `ai_engine/gst_calculator.py`: given amount + rate + type (intra/inter), return CGST, SGST, IGST, total | P0 |
| 1.3 | **Expense category mapping** | `ai_engine/category_mappings.py` or `expense_categories.py`: HSN/SAC → category + default GST rate; extensible for learning later | P0 |
| 1.4 | **OCR service** | `ai_engine/ocr_service.py`: extract text from image/PDF; Tesseract first, optional Google Vision, EasyOCR fallback; support Hindi/English | P0 |
| 1.5 | **Invoice processor (orchestrator)** | `ai_engine/invoice_processor.py`: `InvoiceProcessor` class — call OCR → parse/LLM extract (vendor, date, line items, amounts) → categorize with AI → apply GST calculator | P0 |
| 1.6 | **Unit tests** | Tests for `gst_calculator`, `gst_rates`, and `invoice_processor` (mock OCR/LLM); ensure GST math and category mapping are correct | P0 |
| 1.7 | **Config / env** | `ai_engine` reads API keys from env (or passed in); no hardcoded secrets | P0 |

### 4.3 File Layout (Target)
```
ai_engine/
├── __init__.py
├── gst_rates.py          # Rates, rules
├── gst_calculator.py     # Compute tax
├── category_mappings.py  # HSN → category + rate
├── ocr_service.py        # Tesseract / Vision / EasyOCR
├── invoice_processor.py  # OCR → LLM → categorize → GST
├── requirements.txt      # Subset for AI engine only (optional)
└── tests/
    ├── test_gst_calculator.py
    └── test_invoice_processor.py  # mocked
```

### 4.4 Success Criteria
- Given a sample invoice image/PDF, `InvoiceProcessor` returns structured data (vendor, date, line items with amount, GST rate, category).
- GST calculator unit tests pass for all rates and intra/inter-state.
- No FastAPI or database dependency in `ai_engine/`.

---

## 5. Phase 2 — Backend API (Week 3–4)

**Goal:** FastAPI application with DB, auth, and invoice upload/processing endpoints.

**Location:** `backend/`

### 5.1 Dependencies
- Phase 0 (DB, Redis, env) and Phase 1 (ai_engine usable as library or subprocess).

### 5.2 Tasks (Ordered)

| # | Task | Deliverable | Priority |
|---|------|-------------|----------|
| 2.1 | **Project layout** | `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/security.py` (JWT), `backend/requirements.txt`, `backend/Dockerfile` | P0 |
| 2.2 | **Database models** | SQLAlchemy 2.0 models: `users`, `businesses`, `invoices`, `invoice_line_items`, `expense_categories`, `gst_returns`; relationships as per PROJECT_OVERVIEW | P0 |
| 2.3 | **Migrations** | Alembic init; first migration creating all tables | P0 |
| 2.4 | **Pydantic schemas** | Request/response schemas for User, Business, Invoice, LineItem, GST summary, etc. | P0 |
| 2.5 | **Auth** | Sign up, login (JWT); protect routes; optional: business selection per user | P0 |
| 2.6 | **Invoice upload** | POST `/api/v1/invoices/upload`: accept file (image/PDF), store in S3/MinIO, create `invoices` row, enqueue processing job (Celery) or run sync in MVP | P0 |
| 2.7 | **Invoice processing** | Celery task (or inline): call `ai_engine.invoice_processor` → save extracted data to `invoices` + `invoice_line_items`; POST `/api/v1/invoices/{id}/process` to trigger | P0 |
| 2.8 | **Invoice CRUD** | GET `/api/v1/invoices/{id}`, PATCH for corrections; list GET with filters (business, date range) | P0 |
| 2.9 | **Business API** | CRUD for businesses (GSTIN, name, type); link to current user | P0 |

### 5.3 File Layout (Target)
```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── invoices.py
│   │   ├── businesses.py
│   │   ├── auth.py
│   │   └── ...
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── models/
│   ├── schemas/
│   └── services/
│       ├── invoice_service.py   # uses ai_engine
│       └── storage_service.py   # S3/MinIO)
├── tests/
├── alembic/
├── requirements.txt
└── Dockerfile
```

### 5.4 Success Criteria
- User can sign up, log in, create a business, upload an invoice, trigger process, and GET invoice with extracted line items.
- Data persisted in PostgreSQL; files in S3/MinIO.

---

## 6. Phase 3 — Frontend MVP (Week 5–6)

**Goal:** Web app for auth, invoice upload, list/detail view, and a simple dashboard.

**Location:** `frontend/`

### 6.1 Dependencies
- Phase 2 backend running; CORS configured for frontend origin.

### 6.2 Tasks (Ordered)

| # | Task | Deliverable | Priority |
|---|------|-------------|----------|
| 3.1 | **Scaffold** | React 18 + Vite, Tailwind, shadcn/ui, TanStack Query, React Router; env for API base URL | P0 |
| 3.2 | **Auth UI** | Login and signup pages; store token; protected layout; logout | P0 |
| 3.3 | **Business context** | Select/create business; use in API calls | P0 |
| 3.4 | **Invoice upload** | Page with drag-drop or file picker; call POST `/api/v1/invoices/upload`; show progress/status | P0 |
| 3.5 | **Invoice list** | Table/cards of invoices (date, vendor, status); link to detail | P0 |
| 3.6 | **Invoice detail** | View extracted data; editable fields (PATCH); trigger “reprocess” if needed | P0 |
| 3.7 | **Dashboard** | Basic stats: count of invoices, recent activity; placeholder for future P&L / GST widgets | P0 |

### 6.3 Success Criteria
- User can sign up, log in, select business, upload invoice, see it in list, open detail, see/edit extracted data.
- UI is responsive and accessible (shadcn helps).

---

## 7. Phase 4 — Reports & GST Returns (Week 7–8)

**Goal:** P&L report, GST liability summary, and GSTR-1 / GSTR-3B JSON generation (GSTN-compliant format).

**Location:** Backend + optional frontend views.

### 7.1 Tasks (Ordered)

| # | Task | Deliverable | Priority |
|---|------|-------------|----------|
| 4.1 | **P&L report** | GET `/api/v1/reports/pl`: aggregate by expense category and period; return income, expenses, net; backend only first | P0 |
| 4.2 | **Expense breakdown** | GET `/api/v1/reports/expenses`: by category, period; for charts | P0 |
| 4.3 | **GST liability** | GET `/api/v1/businesses/{id}/gst/liability`: summary of output tax, ITC, payable by period | P0 |
| 4.4 | **GSTR-1 preparation** | POST `/api/v1/gst/gstr1/prepare`: generate JSON per GSTN spec (outward supplies, B2B/B2C/export); validate structure | P0 |
| 4.5 | **GSTR-3B preparation** | POST `/api/v1/gst/gstr3b/prepare`: summary return (outward, ITC, tax payable); validate structure | P0 |
| 4.6 | **Validation rules** | Document and implement business rules (e.g., GSTIN format, date ranges); reject invalid payloads | P0 |
| 4.7 | **Frontend reports** | Simple report pages: P&L table, GST liability summary, “Download GSTR-1/3B JSON” buttons | P0 |

### 7.2 Success Criteria
- P&L and GST liability match expected values for a small set of test invoices.
- GSTR-1 and GSTR-3B JSON pass GSTN schema/format checks (manual or scripted).
- Frontend can display reports and download JSON.

---

## 8. Phase 5 — Polish & Testing (Week 9–10)

**Goal:** Reliable, documented, and supportable MVP.

### 8.1 Tasks
- [ ] **E2E tests:** Full flow (register → upload → process → view report) via Playwright or Cypress; run in CI.
- [ ] **API tests:** Pytest for critical endpoints (auth, upload, process, reports).
- [ ] **Error handling:** Consistent error responses (4xx/5xx), validation messages, and logging.
- [ ] **Documentation:** `docs/API.md` (OpenAPI export + key endpoints), `docs/GST_RULES.md` (rates, GSTR-1/3B notes), `docs/DEPLOYMENT.md` (env, Docker, deploy steps).
- [ ] **Beta onboarding:** Short guide or checklist for first 5–10 beta users.

### 8.2 Success Criteria
- E2E suite passes; critical API paths covered by tests.
- New developer can deploy using DEPLOYMENT.md and run E2E.

---

## 9. Phase 6 — Launch Prep (Week 11–12)

**Goal:** Production-ready deployment and first paying/beta customers.

### 9.1 Tasks
- [ ] **Deployment:** Deploy backend + workers + frontend (e.g., Railway, Render, or AWS); DB and Redis in production; S3 for files.
- [ ] **CI/CD:** GitHub Actions for test, build, and deploy (or link to existing pipeline).
- [ ] **Monitoring & logging:** Structured logs; health checks; optional error tracking (e.g., Sentry).
- [ ] **Security:** HTTPS, env secrets in platform (no .env in repo); rate limiting on auth and upload.
- [ ] **First users:** Onboard 5+ beta users; target first 10 paying customers per business plan.

### 9.2 Success Criteria
- App is live and stable; at least one successful GSTR-1/3B JSON download by a beta user.
- Monitoring and logs in place for incidents.

---

## 10. Dependencies Between Phases

```
Phase 0 (Prereqs)
    ↓
Phase 1 (AI engine)  ← no dependency on 2/3
    ↓
Phase 2 (Backend)    ← depends on 0, 1
    ↓
Phase 3 (Frontend)   ← depends on 2
    ↓
Phase 4 (Reports)    ← depends on 2 (and 3 for UI)
    ↓
Phase 5 (Polish)     ← depends on 2, 3, 4
    ↓
Phase 6 (Launch)     ← depends on 5
```

**Critical path:** Phase 1 must be solid (GST logic, extraction accuracy); Phase 2 must expose clean APIs for frontend and reports.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| GST rules change | Keep `gst_rates` and rules in one place; document sources (GST portal, notifications). |
| LLM/OCR cost/latency | Use cheaper/smaller models for classification; cache; queue long jobs (Celery). |
| GSTN API availability | GSTR filing integration is P1; MVP can generate JSON for manual upload. |
| Multi-language invoices | Tesseract + EasyOCR + optional Google Vision; LLM for language-agnostic extraction. |
| Data privacy | Store files in private bucket; no PII in logs; comply with local data norms. |

---

## 12. Out of Scope for Initial MVP (Post–Launch)

- WhatsApp integration (forward invoice → process)
- GST portal API filing (only JSON generation in MVP)
- Mobile app (React Native)
- Multi-tenant SaaS billing (subscription tiers)
- CA review workflow
- API access for third parties

These can be added in a **Phase 7+** roadmap once MVP is live and validated.

---

## 13. Next Immediate Actions

1. **Complete Phase 0:** Create `backend/requirements.txt`, root `docker-compose.yml`, and `docs/SETUP.md`.
2. **Start Phase 1:** Implement `ai_engine/gst_rates.py` and `ai_engine/gst_calculator.py`, then add tests.
3. **Then:** `ai_engine/ocr_service.py` → `ai_engine/invoice_processor.py` → integrate with backend in Phase 2.

Use **PROJECT_OVERVIEW.md** for schema details, API list, and business context; use this document for **execution order and task-level planning**.
