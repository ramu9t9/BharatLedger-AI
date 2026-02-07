# BharatLedger AI - Project Overview

**Project Path:** `G:\Projects\BharatLedger_AI`  
**Created:** 2026-02-06  
**Status:** Ready for Implementation  

---

## 1. Executive Summary

**BharatLedger AI** is an AI-powered accounting assistant for Indian MSMEs. It automates GST compliance, expense categorization, invoice processing, and reporting—addressing a ₹5,000+ crore market of small businesses struggling with manual accounting and high CA costs.

### One-Line Pitch
> AI that reads Indian invoices (any language), categorizes expenses, calculates GST, and prepares returns—at a fraction of CA cost.

---

## 2. Problem Statement

| Pain Point | Impact | Current Cost |
|------------|--------|--------------|
| GST compliance | Monthly/quarterly filing complexity | High error risk |
| Expense categorization | Hours of manual entry | Lost productivity |
| Invoice management | Paper + digital chaos | Missed deductions |
| Tax calculations | Easy to make mistakes | Penalties |
| Language barriers | Regional language preference | Exclusion |
| CA dependency | Basic compliance | ₹5,000–₹15,000/month |

**Target:** 63 million Indian MSMEs; 5M+ digitized and addressable.

---

## 3. Solution Overview

### Core Capabilities
1. **Smart Invoice Processing** — Read invoices/receipts in any language/format
2. **AI Expense Categorization** — Auto-categorize with GST rates, learn from corrections
3. **GST Return Preparation** — GSTR-1, GSTR-3B automation with validation
4. **Simple Reports** — P&L, GST liability, expense breakdown in plain language
5. **Alerts** — Filing deadlines, savings opportunities, anomaly detection

### Differentiation
- **Indian-first:** Regional languages, local invoice formats (bill book, khata)
- **AI-first:** Learns from corrections, handles messy real-world data
- **Mobile-first:** WhatsApp-forward, photo upload, 3-tap workflow

---

## 4. MVP Feature Set (Months 1–3)

### Phase 1: Foundation (Week 1–4)
| Feature | Description | Priority |
|---------|-------------|----------|
| Invoice OCR | Extract text from images/PDFs (Tesseract + Google Vision) | P0 |
| AI Classification | Categorize line items, determine GST rates | P0 |
| GST Calculator | CGST/SGST/IGST, reverse charge, composition | P0 |
| Expense Categorizer | Map to chart of accounts, learn from corrections | P0 |
| REST API | FastAPI backend for all operations | P0 |
| Database Schema | PostgreSQL for invoices, businesses, users | P0 |

### Phase 2: User Experience (Week 5–8)
| Feature | Description | Priority |
|---------|-------------|----------|
| Web Dashboard | React frontend—upload, view, edit | P0 |
| Invoice Upload | Photo, PDF, Excel import | P0 |
| WhatsApp Integration | Forward invoice → process (later) | P1 |
| Basic Reports | P&L, GST liability summary | P0 |
| User Auth | Sign up, login, business profiles | P0 |

### Phase 3: Compliance (Week 9–12)
| Feature | Description | Priority |
|---------|-------------|----------|
| GSTR-1 Preparation | Sales return JSON generation | P0 |
| GSTR-3B Preparation | Summary return automation | P0 |
| Validation Rules | GSTN format compliance, business logic | P0 |
| Filing Integration | GST portal API (where available) | P1 |

---

## 5. Technology Stack

### Backend
| Component | Choice | Purpose |
|-----------|--------|---------|
| Language | Python 3.11+ | AI/ML, fast development |
| Framework | FastAPI | Async, OpenAPI, validation |
| Database | PostgreSQL | ACID, JSON support |
| ORM | SQLAlchemy 2.0 | Models, migrations |
| Task Queue | Celery + Redis | Async jobs (OCR, AI) |
| Caching | Redis | Sessions, rate limits |

### AI & OCR
| Component | Choice | Purpose |
|-----------|--------|---------|
| LLM | OpenAI GPT-4 / OpenRouter | Classification, extraction |
| OCR | Tesseract 5 + Google Vision | Multi-language text extraction |
| Fallback OCR | EasyOCR | Indian languages |
| Embeddings | OpenAI / Local | Similarity, categorization |

### Frontend
| Component | Choice | Purpose |
|-----------|--------|---------|
| Web | React 18 + Vite | Dashboard, forms |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible |
| Mobile (Phase 2) | React Native | Native mobile app |
| State | TanStack Query | Server state, caching |

### Infrastructure
| Component | Choice | Purpose |
|-----------|--------|---------|
| Storage | AWS S3 / MinIO | Invoice files, exports |
| Hosting | AWS EC2 / Railway / Render | Backend + workers |
| CI/CD | GitHub Actions | Test, deploy |
| Containerization | Docker | Dev parity, deployment |

---

## 6. Project Structure (Target)

```
BharatLedger_AI/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   │   ├── invoices.py
│   │   │   ├── businesses.py
│   │   │   ├── gst.py
│   │   │   └── reports.py
│   │   ├── core/              # Config, security
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── invoice_processor.py
│   │   │   ├── ocr_service.py
│   │   │   ├── ai_classifier.py
│   │   │   └── gst_calculator.py
│   │   └── main.py
│   ├── tests/
│   ├── alembic/               # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
│   ├── package.json
│   └── Dockerfile
│
├── ai_engine/                  # Standalone AI modules (optional)
│   ├── invoice_processor.py
│   ├── gst_rates.py
│   └── category_mappings.py
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── GST_RULES.md
│   └── DEPLOYMENT.md
│
├── scripts/                    # Utility scripts
│   ├── seed_data.py
│   └── migrate.py
│
├── .env.example
├── docker-compose.yml
├── PROJECT_OVERVIEW.md         # This file
└── README.md
```

---

## 7. Database Schema (Core Entities)

### Tables
| Table | Purpose |
|-------|---------|
| `users` | Auth, profile |
| `businesses` | GSTIN, name, type (regular/composition) |
| `invoices` | Raw file path, extracted JSON, status |
| `invoice_line_items` | Item, amount, GST rate, category |
| `expense_categories` | Chart of accounts, GST mapping |
| `gst_returns` | GSTR-1/3B drafts, filed status |
| `reports` | Cached P&L, liability reports |

### Key Relationships
- User → Businesses (1:N)
- Business → Invoices (1:N)
- Invoice → Line Items (1:N)
- Line Item → Expense Category (N:1)
- Business → GST Returns (1:N)

---

## 8. API Design (Core Endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/invoices/upload` | Upload invoice (file) |
| GET | `/api/v1/invoices/{id}` | Get invoice + extracted data |
| PATCH | `/api/v1/invoices/{id}` | Edit/correct extraction |
| POST | `/api/v1/invoices/{id}/process` | Trigger AI processing |
| GET | `/api/v1/businesses/{id}/gst/liability` | GST liability summary |
| POST | `/api/v1/gst/gstr1/prepare` | Generate GSTR-1 JSON |
| POST | `/api/v1/gst/gstr3b/prepare` | Generate GSTR-3B JSON |
| GET | `/api/v1/reports/pl` | P&L statement |
| GET | `/api/v1/reports/expenses` | Expense breakdown |

---

## 9. GST Implementation Notes

### GST Rates (India)
- 0%, 5%, 12%, 18%, 28%
- HSN/SAC codes for categorization
- Reverse charge, composition scheme handling
- State-wise SGST/IGST logic

### GSTR-1 (Outward Supplies)
- B2B, B2C, export sections
- Invoice-level detail
- JSON format per GSTN spec

### GSTR-3B (Summary Return)
- Outward taxable supplies
- Inward supplies (ITC)
- Tax payable, payment

---

## 10. Business Model

### Pricing (Monthly)
| Tier | Price | Invoices | Features |
|------|-------|----------|----------|
| Free | ₹0 | 50 | Basic reports, limited support |
| Starter | ₹499 | 200 | GST filing, WhatsApp support |
| Pro | ₹1,499 | 1,000 | CA review, multi-business |
| Business | ₹2,999 | Unlimited | API access, priority support |

### Revenue Targets
- **Year 1:** 1,000 customers → ~₹84L ARR
- **Year 2:** 5,000 customers + enterprise → ₹3–5 Cr ARR

---

## 11. Implementation Roadmap

### Week 1–2: Core AI Engine
- [ ] InvoiceProcessor class (OCR + AI extraction)
- [ ] GST calculator (all rates, rules)
- [ ] Expense category mapping (HSN-based)
- [ ] Unit tests for GST logic

### Week 3–4: Backend API
- [ ] FastAPI project setup
- [ ] PostgreSQL + SQLAlchemy models
- [ ] Invoice upload & processing endpoints
- [ ] Basic auth (JWT)

### Week 5–6: Frontend MVP
- [ ] React + Vite setup
- [ ] Login/signup
- [ ] Invoice upload UI
- [ ] Invoice list & detail view
- [ ] Basic dashboard

### Week 7–8: Reports & GST
- [ ] P&L report
- [ ] GST liability summary
- [ ] GSTR-1 JSON generation
- [ ] GSTR-3B JSON generation

### Week 9–10: Polish & Testing
- [ ] End-to-end tests
- [ ] Error handling, validation
- [ ] Documentation
- [ ] Beta user onboarding

### Week 11–12: Launch Prep
- [ ] Production deployment
- [ ] Monitoring, logging
- [ ] First 10 paying customers

---

## 12. Environment & Dependencies

### Required Services
- PostgreSQL 15+
- Redis
- Object storage (S3-compatible)

### API Keys
- OpenAI / OpenRouter (LLM)
- Google Cloud Vision (OCR, optional)
- AWS (S3, if using)

### .env Template
```
DATABASE_URL=postgresql://user:pass@localhost:5432/bharatledger
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
GOOGLE_VISION_KEY=... (optional)
S3_BUCKET=...
SECRET_KEY=...
```

---

## 13. Success Criteria (MVP)

- [ ] User can upload invoice (image/PDF) and get structured extraction
- [ ] AI categorizes expenses with GST rates
- [ ] GST liability calculated correctly for sample invoices
- [ ] GSTR-1 and GSTR-3B JSON generated per GSTN format
- [ ] Basic P&L report available
- [ ] Web app deployed and usable by 5+ beta users

---

## 14. References

- [GST Portal](https://www.gst.gov.in/)
- [GSTN API Documentation](https://developer.gst.gov.in/)
- [HSN Code List](https://www.gst.gov.in/docs/gstn/annexures.pdf)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenRouter](https://openrouter.ai/docs)

---

**Next Step:** Begin Week 1–2 implementation—InvoiceProcessor and GST Calculator modules.
