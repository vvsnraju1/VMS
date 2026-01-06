# 🏥 VMS Pro - Validation Management System

## Enterprise POC for Pharmaceutical Computer System Validation

A comprehensive 16-module Validation Management System demonstrating enterprise-grade CSV capabilities with AI assistance, complete traceability, and 21 CFR Part 11 compliance features.

![VMS Pro Banner](https://img.shields.io/badge/VMS-Pro-14b8a6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI-blue?style=for-the-badge)
![GAMP 5](https://img.shields.io/badge/GAMP%205-Aligned-green?style=for-the-badge)

---

## 🎯 Purpose

This POC demonstrates validation lifecycle thinking, GxP awareness, traceability, audit readiness, and controlled AI assistance for pharmaceutical and life sciences clients.

---

## 📦 Complete 16-Module Suite

### A. Core Governance Modules (Foundation)

| Module | Name | Description |
|--------|------|-------------|
| 1️⃣ | **Validation Project Management** | Create projects, define GxP classification, validation approach |
| 2️⃣ | **System Boundary & Intended Use** | In-scope/out-of-scope definition, interfaces, dependencies |
| 3️⃣ | **URS Management** | User Requirements with unique IDs, GxP impact, versioning |
| 4️⃣ | **Risk Assessment & Risk Control** | Patient safety, product quality, data integrity risk matrix |
| 5️⃣ | **Specification Management** | Functional Specifications (FS) linked to URS |

### B. Operational Validation Modules (Execution)

| Module | Name | Description |
|--------|------|-------------|
| 6️⃣ | **Test Case Management** | Test generation from FS, types, acceptance criteria |
| 7️⃣ | **Test Execution Management** | Execute tests, capture evidence, track re-executions |
| 8️⃣ | **Deviation & CAPA Management** | Root cause analysis, corrective/preventive actions |
| 9️⃣ | **Traceability Matrix (RTM)** | URS → FS → TC → Result → Deviation chain |
| 🔟 | **Validation Summary Report** | Automated VSR generation with validation decision |

### C. Compliance & Control Modules

| Module | Name | Description |
|--------|------|-------------|
| 1️⃣1️⃣ | **Audit Trail & Data Integrity** | Who/what/when/why logging, 21 CFR Part 11 compliant |
| 1️⃣2️⃣ | **Role-Based Access Control** | Admin, Validation Lead, QA, Executor roles |
| 1️⃣3️⃣ | **Electronic Signatures** | Mocked for POC (review, approval, execution) |

### D. Intelligence & Automation Modules

| Module | Name | Description |
|--------|------|-------------|
| 1️⃣4️⃣ | **AI-Assisted Validation** | Risk suggestion, ambiguity detection, content generation |
| 1️⃣5️⃣ | **Change Impact Assessment** | Change requests, impact analysis, revalidation scope |
| 1️⃣6️⃣ | **Metrics & Validation Analytics** | Role-specific dashboards, trends, compliance scores |

---

## 🖥️ Role-Specific Dashboards

Each role gets a customized, innovative dashboard:

| Role | Dashboard Focus |
|------|-----------------|
| **Admin** | System-wide analytics, project overview, audit controls |
| **Validation Lead** | Project status, draft items, AI assistance tools |
| **QA Reviewer** | Approval queue, deviation review, compliance metrics |
| **Executor** | Test execution queue, my results, deviation logging |

---

## 🤖 AI Capabilities

All AI suggestions are:
- ✅ **Explainable** - Clear reasoning provided
- ✅ **Logged** - Recorded in audit trail as "AI-System"
- ✅ **Overridable** - Human always has final decision
- ❌ **Cannot Auto-Approve** - AI never approves anything

| AI Feature | Description |
|------------|-------------|
| Risk Assessment | Analyze URS for patient safety, quality, data integrity risks |
| Ambiguity Detection | Identify vague language and suggest improvements |
| FS Generation | Draft Functional Specifications from approved URS |
| Test Case Suggestion | Generate test cases from FS |
| Root Cause Analysis | Suggest root cause and CAPA for deviations |
| Change Impact Analysis | Identify affected artifacts for change requests |
| Consistency Check | Validate traceability completeness |

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **Models:** Pydantic
- **Storage:** In-memory (resets on restart)
- **CORS:** Enabled for frontend

### Frontend
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **UI Library:** Ant Design 5
- **Styling:** Custom CSS with Premium Design System
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State:** React Context

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Fake login (returns role) |

### Projects (Module 1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create project |
| PATCH | `/projects/{id}/status` | Update status |

### System Boundary (Module 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/boundary` | Get boundary |
| POST | `/projects/{id}/boundary` | Create boundary |
| POST | `/boundary/{id}/approve` | Approve boundary |

### URS (Module 3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/urs` | List requirements |
| POST | `/projects/{id}/urs` | Create requirement |
| POST | `/urs/{id}/approve` | Approve (QA only) |
| POST | `/urs/{id}/ai-risk` | AI risk assessment |
| POST | `/urs/{id}/ai-ambiguity` | AI ambiguity check |
| POST | `/urs/{id}/ai-suggest-fs` | AI suggest FS |

### Specifications (Module 5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/fs` | List FS |
| POST | `/fs` | Create FS |
| POST | `/fs/{id}/approve` | Approve FS |
| POST | `/fs/{id}/ai-suggest-tc` | AI suggest test cases |

### Test Management (Module 6 & 7)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/test-cases` | List test cases |
| POST | `/test-cases` | Create test case |
| GET | `/projects/{id}/test-execution` | List executions |
| POST | `/test-execution` | Execute test |

### Deviations (Module 8)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/deviations` | List deviations |
| POST | `/deviations` | Create deviation |
| PATCH | `/deviations/{id}/investigate` | Add investigation |
| PATCH | `/deviations/{id}/capa` | Assign CAPA |
| PATCH | `/deviations/{id}/close` | Close deviation |
| POST | `/deviations/{id}/ai-root-cause` | AI root cause |

### Traceability (Module 9)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/traceability` | Get RTM |

### VSR (Module 10)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/vsr` | Generate VSR |

### Change Management (Module 15)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/changes` | List changes |
| POST | `/projects/{id}/changes` | Create change request |
| PATCH | `/changes/{id}/analyze` | Impact analysis |
| PATCH | `/changes/{id}/approve` | Approve change |
| POST | `/changes/{id}/ai-impact` | AI impact analysis |

### Audit Trail (Module 11)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-trail` | Get audit entries |

### Dashboards (Module 16)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/{role}` | Role-specific dashboard |

---

## 🎨 Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#1e3a5f` | Headers, primary actions |
| Secondary | `#14b8a6` | AI features, success accents |
| Success | `#22c55e` | Passed, approved, complete |
| Warning | `#f59e0b` | Medium risk, pending |
| Danger | `#ef4444` | Failed, high risk, errors |
| Info | `#3b82f6` | Information, processing |

### Typography
- **Font:** Plus Jakarta Sans
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

---

## 📋 Sample Data

The system initializes with sample data including:
- 3 validation projects (LIMS, ERP Integration, DMS)
- 5 requirements with risk assessments
- 3 functional specifications
- 4 test cases with executions
- 1 deviation with CAPA
- 1 change request
- Complete audit trail

---

## 🔒 Compliance Features

- **21 CFR Part 11** audit trail format
- **GAMP 5** risk-based approach
- **EU Annex 11** data integrity
- Segregation of duties (no self-approval)
- Complete traceability chain
- AI actions clearly identified

---

## 📄 License

This is a POC demonstration project. For production use, additional security, authentication, and compliance features would be required.

---

## 🤝 Demo Notes

This application is designed to demo to a pharma QA head and convey:
- ✅ Validation maturity
- ✅ Regulatory understanding  
- ✅ AI used responsibly
- ✅ Enterprise intent

---

Built with ❤️ for pharmaceutical validation excellence.
