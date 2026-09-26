# SignalCraft

> **"Show what you can build — not just what you claim."**

SignalCraft is a **technical capability verification platform** for engineering hiring. It replaces inflated resume claims and algorithmic leetcode trivia with an evidence-based verification loop: candidates prove their abilities through timed technical assessments, functional codebases, and Architectural Decision Records (ADRs), which are inspected with automated anti-gaming tools, assisted by Claude AI, and verified by authoritative human reviewers.

---

## The Core Product Flow

```text
RECRUITER
  └── Creates Job + Defines Required Skill Benchmarks

BUILDER
  ├── Completes Timed Practical Assessment (MCQ, Coding, Debugging, SQL, Reasoning)
  ├── Submits Project Evidence (Git Repo + Live Demo) + Structured ADR
  ├── Automated Anti-Gaming Similarity Check (Jaccard token matching & LLM artifact detection)
  └── Claude AI Reference Assistance Layer (Advisory rubrics, strengths & weaknesses)

REVIEWER
  ├── Evaluates Candidate Code & ADR Trade-offs
  ├── Inspects Anti-Gaming Flags & "AI Reference Only" Advisory
  └── Submits Authoritative 4-Part Rubric Scores (1–5 scale)

SIGNALCRAFT ENGINE
  ├── Generates 2-Year Cryptographic Verified Scorecard (SC-BE-2026-XXX)
  └── Assigns Deterministic Leaderboard Ranking

RECRUITER
  ├── Discovers Verified Talent by Skill, Domain, and Score
  ├── Inspects Immutable Cryptographic Proof Trail
  └── Shortlists Verified Candidates for Active Vacancies
```

---

## Key Features

1. **Practical Assessment Engine**:
   - Covers 5 core competencies: Coding, Concurrency Debugging, SQL Window Queries, REST APIs, and Architectural Reasoning.
   - Answer keys are strictly protected and never exposed across the network.
2. **Architectural Decision Records (ADRs)**:
   - Candidates must document *What* they built, *Why* they chose specific patterns, *Alternatives* evaluated, *Trade-offs* accepted, and *Scaling* strategies.
3. **Anti-Gaming & Plagiarism Scanner**:
   - Computes Jaccard similarity against past submissions.
   - Detects raw LLM prompt artifacts, boilerplate stuffing, and superficial claims.
   - Flags suspicious submissions for human inspection without automatic disqualification.
4. **Claude AI Advisory Layer**:
   - Uses `claude-3-5-sonnet` to critique trade-offs and suggest reference rubrics.
   - **Crucial Guardrail**: Labeled `AI REFERENCE ONLY`. AI never makes hiring decisions; human review remains solely authoritative.
   - Automatic fallback engine ensures zero downtime if the AI API is unavailable.
5. **Authoritative Human Peer Review**:
   - Reviewer queue matched by domain expertise.
   - Human reviewers score 4 rubrics: Correctness, Architecture, Code Quality, and Trade-off Awareness.
6. **2-Year Verified Scorecard**:
   - Composite score formula: $40\%$ Assessment $+ 60\%$ Human Review.
   - Features dynamic 2-year validity and a tamper-evident cryptographic fingerprint.
7. **Deterministic Ranking**:
   - Transparent ranking formula:
     $$\text{ranking\_score} = \text{difficulty\_weight} \times \text{review\_score} \times \text{reviewer\_credibility\_weight} \times \text{recency\_decay}$$

---

## Documentation Index

Comprehensive documentation is provided in the repository:

- 📖 [**Demo Guide (`demo.md`)**](file:///c:/Users/Nayana%20k%20l/OneDrive/Documents/Hackmysore1.0/demo.md): Step-by-step 5-minute hackathon judge walkthrough and pre-seeded personas.
- 🏗️ [**Architecture (`architecture.md`)**](file:///c:/Users/Nayana%20k%20l/OneDrive/Documents/Hackmysore1.0/architecture.md): Deep-dive system architecture, Mermaid ER diagrams, sequence flows, and component breakdown.
- 🤖 [**AI Implementation (`ai.md`)**](file:///c:/Users/Nayana%20k%20l/OneDrive/Documents/Hackmysore1.0/ai.md): Claude integration specifications, prompt engineering, anti-gaming algorithms, and human authority guardrails.
- 🛠️ [**Resources (`resources.md`)**](file:///c:/Users/Nayana%20k%20l/OneDrive/Documents/Hackmysore1.0/resources.md): Complete list of technologies, official documentation links, and usage rationale.

---

## Quickstart & Local Setup

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### 1. Installation

Clone the repository and install dependencies:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
PORT=4000
DATABASE_PATH=signalcraft.db
# Optional: Anthropic Claude API Key (if omitted, deterministic local fallback engine activates automatically)
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Running the Application

Open two terminal windows:

**Terminal 1 — Backend API Server**:
```bash
cd server
npm run dev
# Server running at http://localhost:4000/api
```

**Terminal 2 — Frontend Application**:
```bash
npm run dev
# Vite client running at http://localhost:5173
```

---

## Running the Automated Test Suite

SignalCraft includes comprehensive automated test suites covering all API contracts, security checks, and end-to-end integration flows:

### 1. Backend API & Security Test Suite (44 Tests)
```bash
cd server
npm run test:api
```
*Validates health checks, question security, duplicate submission prevention, anti-gaming scans, AI advisory layers, reviewer rubric validation, role separation (blocking builder review submissions), 2-year scorecard generation, ranking events, and recruiter shortlisting.*

### 2. End-to-End Flow Integration Test (25 Tests)
```bash
node test-integration.js
```
*Validates the entire 9-stage journey from Recruiter Job creation to Builder Assessment, Project + ADR submission, Anti-Gaming scan, Claude AI report, Reviewer verification, Verified Scorecard generation, and Candidate discovery.*

### 3. Production Frontend Build
```bash
npm run build
```
*Compiles and bundles production client assets via Vite.*

---

## Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4 | Fast, modern client application with dark mode UI |
| **Client Routing** | React Router DOM 7 | Seamless transitions across Builder, Reviewer, and Recruiter views |
| **Backend API** | Node.js + Express 4 | Modular REST API with role separation and input validation |
| **Database** | SQLite (`node:sqlite` / `better-sqlite3`) | Persistent relational database for assessments, submissions, and credentials |
| **AI Layer** | Anthropic Claude API (`claude-3-5-sonnet`) | Advisory ADR analysis, template overlap detection, and reference rubrics |
| **Testing** | Node.js native test runner | Fast, deterministic API and integration test execution |

---

## License

This project was built for the **HackMysore Hackathon**.
