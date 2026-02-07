# Start Here — BharatLedger AI

## Project Location
`G:\Projects\BharatLedger_AI`

---

## What to Read First

1. **PROJECT_OVERVIEW.md** — Full implementation guide (tech stack, schema, API, business context)
2. **docs/IMPLEMENTATION_ROADMAP.md** — Phased implementation plan with task-level breakdown and dependencies
3. **README.md** — Quick reference

---

## Implementation Order

### Week 1–2: Core AI Engine
Start in `ai_engine/`:
- `invoice_processor.py` — OCR + AI extraction
- `gst_calculator.py` — GST rates and logic
- `expense_categories.py` — HSN/category mapping

### Week 3–4: Backend
Create `backend/` with FastAPI:
- Invoice upload endpoint
- Database models (PostgreSQL)
- Processing pipeline

### Week 5–6: Frontend
Create `frontend/` with React:
- Login, upload UI
- Invoice list and detail
- Basic dashboard

---

## Setup Checklist

- [ ] Copy `.env.example` → `.env`
- [ ] Add OPENROUTER_API_KEY (or OPENAI_API_KEY)
- [ ] Install PostgreSQL and Redis (or use Docker)
- [ ] Create Python venv: `python -m venv venv`
- [ ] Install dependencies: `pip install fastapi uvicorn sqlalchemy python-dotenv`

---

## Key Files Created

| File | Purpose |
|------|---------|
| PROJECT_OVERVIEW.md | Detailed implementation guide |
| README.md | Project summary |
| .env.example | Environment template |
| .gitignore | Git ignore rules |
| START_HERE.md | This file |

---

**Ready to build.** Open PROJECT_OVERVIEW.md and start with Week 1–2 tasks.
