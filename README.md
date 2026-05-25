# MindBricks — Solvio

**AI-powered language learning platform** built on the [MindBricks](https://mindbricks.com) microservice stack. Solvio delivers personalized English (and multi-language) coaching across writing, speaking, listening, and reading, with classroom management and institutional isolation for schools and training providers.

Maintained by **[Ethosoft](https://github.com/Ahmet2001/Mindbricks)**.

---

## Overview

Solvio is a comprehensive, AI-driven language learning ecosystem. It connects a React frontend to multiple backend microservices (auth, notification, BFF, and eight business services) exposed through MindBricks-generated APIs.

| Area | Description |
|------|-------------|
| **Learners** | Writing, speaking, listening, and reading labs with AI feedback |
| **Teachers** | Class assignments, profiles, and institutional environments |
| **Platform** | Auth, user management, MCP/BFF integration, and realtime helpers |

Backend services support **preview**, **staging**, and **production** deployments; the frontend is designed to let developers switch API targets during development.

---

## Repository layout

```
Mindbricks/
├── apps/
│   └── solvio-frontend/     # React + Vite + TypeScript app (scaffold)
├── docs/
│   └── frontend-api-guides/ # REST API guides for AI-assisted frontend codegen
├── LICENSE                  # MIT — Ethosoft
└── README.md
```

### `docs/frontend-api-guides/`

Thirteen guides for AI coding agents and frontend developers. Each document describes REST contracts, response envelopes, and UI requirements for one service or concern:

| # | Guide | Topic |
|---|--------|--------|
| 1 | `frontend-prompt-1-authManagement.md` | Authentication |
| 2 | `frontend-prompt-2-verification.md` | Verification |
| 3 | `frontend-prompt-3-profile.md` | Profile |
| 4 | `frontend-prompt-4-userManagement.md` | User management |
| 5 | `frontend-prompt-5-mcpbffIntegration.md` | MCP / BFF |
| 6 | `frontend-prompt-6-aiAgentService.md` | AI agent |
| 7 | `frontend-prompt-7-classAssignmentService.md` | Class assignments |
| 8 | `frontend-prompt-8-languageProfileService.md` | Language profile |
| 9 | `frontend-prompt-9-listeningLabService.md` | Listening lab |
| 10 | `frontend-prompt-10-personalVocabularyService.md` | Personal vocabulary |
| 11 | `frontend-prompt-11-readingLabService.md` | Reading lab |
| 12 | `frontend-prompt-12-speakingLabService.md` | Speaking lab |
| 13 | `frontend-prompt-13-writingLabService.md` | Writing lab |

Start with **Part 1 (Authentication)** before implementing other modules.

### `apps/solvio-frontend/`

Vite-based React 18 application with Tailwind CSS, Zustand, React Router, and API proxies to the Solvio preview host (`solvio.prw.mindbricks.com`). Run from that directory:

```bash
npm install
npm run dev
```

Default dev server: `http://localhost:3000`.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Recharts, Axios, Zustand |
| Backend (external) | MindBricks microservices — auth, notification, BFF, labs, bucket, realtime |
| API style | REST with standardized success/error envelopes and pagination metadata |

---

## API response convention

Successful responses use a JSON envelope with `status: "OK"`, metadata (`elapsedMs`, `requestId`, paging, permissions), and a data key (e.g. `products`). Errors return structured JSON with standard HTTP status codes (400, 401, 403, 404, etc.). Details are documented in each guide under `docs/frontend-api-guides/`.

---

## Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ahmet2001/Mindbricks.git
   cd Mindbricks
   ```

2. **Read the API guides** in `docs/frontend-api-guides/` (begin with Part 1).

3. **Run the frontend** (when `src/` is present or after generating UI from the guides):

   ```bash
   cd apps/solvio-frontend
   npm install
   npm run dev
   ```

4. **Select environment** on the app home page when implementing multi-environment support (preview / staging / production).

---

## Team & license

This project is developed by **Ethosoft** and released under the **MIT License**. See [LICENSE](LICENSE) for full terms.

---

## Links

- **Repository:** [github.com/Ahmet2001/Mindbricks](https://github.com/Ahmet2001/Mindbricks)
- **MindBricks platform:** [mindbricks.com](https://mindbricks.com)
