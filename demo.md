# SignalCraft — Demo Guide & Walkthrough

> **Tagline**: *"Show what you can build — not just what you claim."*

This document provides a concise, step-by-step walkthrough for evaluating and presenting the **SignalCraft** platform during hackathon judging.

---

## 1. Quickstart & Service Verification

Before initiating the demo, confirm both services are active:

### Backend API Server
- **URL**: `http://localhost:4000/api`
- **Health Check**: `http://localhost:4000/api/health`
- **Start Command**:
  ```bash
  cd server
  npm run dev
  ```

### Frontend Application
- **URL**: `http://localhost:5173`
- **Start Command**:
  ```bash
  npm run dev
  ```

---

## 2. Pre-Seeded Demo Personas

SignalCraft comes pre-seeded with realistic personas demonstrating every state of the verification pipeline:

| Persona | Role | Domain | Status in System |
| :--- | :---: | :--- | :--- |
| **Rahul Sharma** | Builder | Backend Engineering | **Verified Candidate**: Has completed assessment, human review, and holds active 2-Year Scorecard (`SC-BE-2026-001`), ranked **#1**. |
| **Priya Nair** | Builder | Frontend Engineering | **In Queue**: Authentic submission awaiting human peer review in the Reviewer Queue. |
| **Arjun Kumar** | Builder | Backend Engineering | **Flagged**: Anti-gaming system flagged submission ($78\%$ similarity, generic boilerplate, LLM disclaimer artifact). |
| **Ananya Rao** | Reviewer | Principal Architect | **Authoritative Reviewer**: Qualified peer reviewer with expertise in Java, SQL, and distributed architecture. |
| **Meera Kapoor** | Recruiter | TechNova Solutions | **Hiring Lead**: Recruiter sourcing verified engineers based on proof rather than resume claims. |

---

## 3. Five-Minute End-to-End Judge Walkthrough

### Step 1: The Problem (Landing Page)
1. Open `http://localhost:5173/`.
2. Notice the core paradigm:
   ```text
   RESUME CLAIM → PRACTICAL PROOF → VERIFICATION → HUMAN REVIEW → 2-YEAR SCORECARD → CAPABILITY HIRING
   ```
3. Click **"Launch Demo"** or select **"Switch Role"** in the top navigation bar.

---

### Step 2: Recruiter Defines the Role
1. Switch to the **Recruiter** role (`Meera Kapoor`).
2. Navigate to **"Create Job"** (`/recruiter/create-job`).
3. Fill in:
   - **Job Title**: Senior Distributed Systems Engineer
   - **Company**: TechNova Solutions
   - **Domain**: Backend Engineering
   - **Required Skills**: Java, SQL, REST API, Concurrency
   - **Min Scorecard Benchmark**: 80/100
4. Click **"Publish Job"**. The required capability benchmarks are now saved and visible to candidates.

---

### Step 3: Builder Proves Capability (Assessment & ADR)
1. Switch to the **Builder** role (`Rahul Sharma` or new candidate).
2. Browse to **"Challenges"** (`/builder/challenges`) and select **"Order Management & Concurrency API"**.
3. **Timed Assessment**:
   - Inspect the interactive assessment interface.
   - Questions cover real problem-solving: MCQ (Idempotency headers), Coding (Spring Boot Order Service), Debugging (Race condition identification), SQL (Window queries), and Reasoning (Synchronous vs. asynchronous trade-offs).
   - Notice that answer keys are never exposed in network payloads.
   - Click **"Submit Assessment"**. The system computes skill-calibrated scores (`Java`: 86, `SQL`: 82, `REST API`: 91, `Debugging`: 88, `Problem Solving`: 89).
4. **Project Evidence & Architectural Decision Record (ADR)**:
   - Provide a repository link (e.g., `https://github.com/rahul-sharma/signalcraft-order-service`).
   - Fill in structured ADR fields:
     - **What**: Order Management API with deterministic stock reservation.
     - **Why**: Row-level write locks prevent race conditions under load.
     - **Alternatives**: Evaluated optimistic locking; rejected due to retry storms.
     - **Trade-offs**: Higher lock duration for guaranteed ACID integrity.
     - **Scaling**: Kafka transactional outbox and read replicas.
   - Click **"Submit Project Evidence"**.

---

### Step 4: Automated Anti-Gaming & Claude AI Analysis
1. Upon submission, automated checks execute instantly:
   - **Anti-Gaming Engine**: Computes token similarity, checks ADR-to-code alignment, and scans for AI boilerplate stuffing.
   - **Claude AI Advisory Layer**: Analyzes technical trade-offs, generates suggested rubrics ($1–5$), and highlights strengths/weaknesses.
2. Note the crucial guardrail:
   - All AI insights are prominently labeled: `AI REFERENCE ONLY`.
   - AI cannot automatically approve or reject candidates.

---

### Step 5: Authoritative Human Peer Review
1. Switch to the **Reviewer** role (`Ananya Rao`).
2. Open the **"Review Queue"** (`/reviewer/queue`):
   - Notice submissions are tagged with **"Expertise Matched"** (Java / Backend).
   - Observe **Priya Nair** (clean submission) and **Arjun Kumar** (highlighted with `FLAGGED: High Similarity` alert).
3. Click **"Review Submission"** on a pending candidate:
   - Reviewer views the candidate's recorded assessment answers, Git repository, and ADR defense.
   - Reviewer inspects the AI advisory report and anti-gaming flags as reference.
4. **Enter Authoritative Rubric Scores (1–5 scale)**:
   - Correctness: `4.5`
   - Architecture: `4.0`
   - Code Quality: `4.5`
   - Trade-off Awareness: `5.0`
5. Enter constructive feedback and click **"Submit Authoritative Verification"**.
6. **Result**: The reviewer's evaluation is authoritative and immediately triggers composite scorecard generation.

---

### Step 6: 2-Year Cryptographic Verified Scorecard
1. The platform issues a tamper-evident scorecard:
   - **Scorecard ID**: e.g., `SC-BE-2026-001`
   - **Composite Score**: Combines practical assessment ($40\%$) and human review ($60\%$).
   - **Skill Radar / Breakdown**: Calibrated across Java, SQL, REST API, Debugging, and Problem Solving.
   - **Issued Date**: Today (e.g., `26 Sep 2026`).
   - **Valid Until**: Exactly 2 years later (`26 Sep 2028`).
   - **Status**: `VALID`.
2. Inspect the **Proof Trail**:
   - Transparent, chronological record linking challenge prompts, Git commits, ADR justifications, anti-gaming clearance, and the reviewer's signature.

---

### Step 7: Recruiter Discovery & Shortlist
1. Switch to the **Recruiter** role (`Meera Kapoor`).
2. Open **"Candidate Discovery"** (`/recruiter/candidates`):
   - Verified talent is ranked deterministically:
     $$\text{ranking\_score} = \text{difficulty\_weight} \times \text{review\_score} \times \text{reviewer\_credibility\_weight} \times \text{recency\_decay}$$
   - Filter by skill: select **"Java"**.
   - Filter by minimum score: set slider to **80+**.
3. Click on a candidate to view their verified scorecard and cryptographic proof trail.
4. Click **"Shortlist Candidate"** for the "Senior Distributed Systems Engineer" job.
5. The shortlist is persisted in the database and accessible under the recruiter's job dashboard.

---

## 4. Key Talking Points for Judges

1. **Proof Over Claims**: Replaces inflated resumes with verified code and defensible trade-offs.
2. **AI Assists, Humans Verify**: Claude acts as an advisory assistant to save reviewer time, but only human peer reviewers have authority to grant credentials.
3. **Anti-Gaming by Design**: Combines Jaccard cross-submission similarity, LLM disclaimer pattern matching, challenge variants, and mandatory ADR defenses.
4. **2-Year Reusable Credential**: Verified scorecards are valid for 2 years, saving builders from repeating repetitive technical interviews for every job application.
5. **Deterministic Ranking**: Transparent ranking formula incorporating challenge difficulty, human review score, reviewer credibility, and subtle recency decay.
