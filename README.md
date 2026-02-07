# BharatLedger AI

AI-powered accounting assistant for Indian MSMEs — GST compliance, expense categorization, invoice processing.

**Project Path:** `G:\Projects\BharatLedger_AI`  
**Status:** Ready for Implementation

## Quick Start

**Single command (after one-time setup):**

```bash
# One-time: copy .env, install deps
copy .env.example .env    # then edit .env (SECRET_KEY, OPENROUTER_API_KEY)
pip install -r backend/requirements.txt
pip install -e ai_engine
cd frontend && npm install && cd ..

# Start everything (Docker + backend + frontend)
py start.py
# or:  npm start
```

- **Backend:** http://localhost:8000  
- **Frontend:** http://localhost:5173  
- **Stop:** Ctrl+C

1. Read `PROJECT_OVERVIEW.md` for full implementation details
2. Read `docs/IMPLEMENTATION_ROADMAP.md` for the phased implementation plan and task breakdown
3. Copy `.env.example` to `.env` and add API keys
4. Follow Phase 0 then Phase 1 in the roadmap (Core AI Engine)

## Structure

```
BharatLedger_AI/
├── PROJECT_OVERVIEW.md   # Detailed implementation guide
├── README.md             # This file
├── START_HERE.md         # Entry point for new devs
├── .env.example          # Environment template
├── backend/              # FastAPI (to be created)
├── frontend/             # React (to be created)
├── ai_engine/            # Invoice AI, GST logic (to be created)
└── docs/                 # Documentation
    └── IMPLEMENTATION_ROADMAP.md  # Phased plan and task breakdown
```

## License

Proprietary. All rights reserved.
