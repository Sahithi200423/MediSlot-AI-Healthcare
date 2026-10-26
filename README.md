# 🏥 MediSlot — Healthcare Management & Smart Appointments

> **Tagline:** Smarter Appointments. Better Clinic Management.

MediSlot is a modern, full-stack, AI-powered healthcare SaaS platform connecting patients, doctors, clinic administrators, and platform operators.

---

## 📁 Repository Structure

```
MediSlot/
├── client/           # React + TypeScript + Vite + Tailwind CSS Frontend
├── server/           # Node.js + Express + TypeScript REST API Backend
├── ai-service/       # Python FastAPI AI/ML microservice (Phase 6 & 7)
├── docs/             # Technical specifications & Database plans
├── tests/            # End-to-end and integration testing suites
├── .gitignore        # Git ignore rules for node, python & env
└── .env.example      # Master environment variable template
```

---

## 🚀 Quick Start (Phase One)

### 1. Prerequisites
- **Node.js**: v18+ (verified with v24.18.1)
- **npm**: v9+ (verified with 11.16.0)
- **Git**: installed
- **Python**: 3.10+ (for later AI phases)

### 2. Client Setup (Frontend)
```bash
cd client
npm install
npm run dev
```
Accessible at: [http://localhost:5173](http://localhost:5173)

### 3. Server Setup (Backend)
```bash
cd server
npm install
npm run dev
```
Accessible at: [http://localhost:5000](http://localhost:5000)
Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1**: Workspace bootstrap, design system, landing page, auth views, 4 dashboard layouts, Express backend with health checks.
- [ ] **Phase 2**: Supabase PostgreSQL database integration and Supabase Auth.
- [ ] **Phase 3**: Doctor scheduling & clinic management engine.
- [ ] **Phase 4**: Real-time appointment booking with double-booking prevention.
- [ ] **Phase 5**: Razorpay payments, refunds, and email/SMS notifications.
- [ ] **Phase 6**: AI Document Summarization (FastAPI + OpenAI + OCR).
- [ ] **Phase 7**: ML Appointment No-Show Prediction (scikit-learn + FastAPI).
- [ ] **Phase 8**: AI Administrative Assistant & Clinical Analytics.
- [ ] **Phase 9**: Automated E2E testing (Playwright), Docker, CI/CD, and production deployment.
