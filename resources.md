# Resources

## Frontend

### React
- **Official Documentation**: [https://react.dev/](https://react.dev/)
- **Usage in SignalCraft**: Powers the single-page application UI, client-side state management, and role-based workflows for Builders, Reviewers, and Recruiters.

### Vite
- **Official Documentation**: [https://vite.dev/](https://vite.dev/)
- **Usage in SignalCraft**: Provides the frontend development server with Hot Module Replacement (HMR) and bundles production client assets.

### Tailwind CSS
- **Official Documentation**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Usage in SignalCraft**: Delivers styling across dashboards, interactive rubric sliders, status tags, and verified scorecard components using Tailwind v4.

### React Router
- **Official Documentation**: [https://reactrouter.com/](https://reactrouter.com/)
- **Usage in SignalCraft**: Manages declarative client-side routing between Builder assessments, Reviewer queues, Recruiter candidate discovery, and verified scorecard views.

---

## Backend

### Node.js
- **Official Documentation**: [https://nodejs.org/docs/](https://nodejs.org/docs/)
- **Usage in SignalCraft**: Serves as the JavaScript runtime for the RESTful API server, anti-gaming algorithms, and automated test runners.

### Express
- **Official Documentation**: [https://expressjs.com/](https://expressjs.com/)
- **Usage in SignalCraft**: Provides the HTTP web application framework, modular routing (`/api/assessments`, `/api/submissions`, `/api/reviews`, `/api/scorecards`, `/api/candidates`, `/api/jobs`), and middleware.

### SQLite
- **Official Documentation**: [https://www.sqlite.org/docs.html](https://www.sqlite.org/docs.html)
- **Usage in SignalCraft**: Serves as the embedded relational database engine persisting users, assessments, questions, submissions, reviews, 2-year scorecards, and audit logs.

### better-sqlite3 / Node.js native sqlite (`node:sqlite`)
- **Official Documentation**:
  - `better-sqlite3`: [https://github.com/WiseLibs/better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
  - `node:sqlite`: [https://nodejs.org/api/sqlite.html](https://nodejs.org/api/sqlite.html)
- **Usage in SignalCraft**: Implements synchronous SQLite database access, prepared statements, and transactional database updates in `server/db.js`.

---

## AI

### Anthropic Claude API
- **Official Documentation**: [https://docs.anthropic.com/](https://docs.anthropic.com/)
- **Usage in SignalCraft**:
  - **ADR Analysis**: Evaluates candidate Architectural Decision Records (ADRs) for technical reasoning quality, structural trade-offs, and consistency with submitted code.
  - **Similarity Detection**: Inspects submissions for AI boilerplate patterns, prompt-stuffing artifacts, and structural plagiarism against known solution templates.
  - **Challenge Variant Generation**: Configures distinct challenge scenarios and evaluation criteria to deter solution sharing.
  - **AI Reference Scoring**: Generates suggested rubric scores (1–5) and critiques to assist human reviewers in the evaluation queue.
- **Human Authority Notice**:
  > **AI does not make the final hiring decision.** All AI-generated analyses, consistency metrics, and suggested rubrics are strictly labeled as `AI REFERENCE ONLY`. Human reviewers remain solely authoritative for final rubric evaluation and candidate verification.

---

## Development Tools

- **Vite Dev Server**: [https://vite.dev/guide/cli.html](https://vite.dev/guide/cli.html) — Local development server with instant HMR and API proxy forwarding.
- **Nodemon**: [https://nodemon.io/](https://nodemon.io/) — Development utility that monitors backend file modifications and restarts the Express server.
- **Oxlint**: [https://oxc.rs/docs/guide/usage/linter.html](https://oxc.rs/docs/guide/usage/linter.html) — High-performance JavaScript and React linter for code health and syntax checks.
- **Node.js Test Runner**: [https://nodejs.org/api/test.html](https://nodejs.org/api/test.html) — Native test suite execution powering `server/test-api.js` and `test-integration.js`.

---

## References

1. React Documentation: [https://react.dev/](https://react.dev/)
2. Vite Guide: [https://vite.dev/guide/](https://vite.dev/guide/)
3. Tailwind CSS Documentation: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
4. React Router Documentation: [https://reactrouter.com/](https://reactrouter.com/)
5. Node.js Documentation: [https://nodejs.org/docs/](https://nodejs.org/docs/)
6. Express.js Documentation: [https://expressjs.com/](https://expressjs.com/)
7. SQLite Documentation: [https://www.sqlite.org/docs.html](https://www.sqlite.org/docs.html)
8. Node.js SQLite API Reference: [https://nodejs.org/api/sqlite.html](https://nodejs.org/api/sqlite.html)
9. Anthropic Claude API Reference: [https://docs.anthropic.com/en/api/getting-started](https://docs.anthropic.com/en/api/getting-started)
10. Oxlint Documentation: [https://oxc.rs/docs/guide/usage/linter.html](https://oxc.rs/docs/guide/usage/linter.html)
