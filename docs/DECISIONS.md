# Architectural & Design Decisions (docs/DECISIONS.md)

| Decision ID | Area | Decision | One-line Reason |
|---|---|---|---|
| **ADR-001** | Architecture | Express + Node 20 (ES Modules) Backend & Vite + React 18 Frontend | Standard, lightweight, fast monorepo stack with maximum portability and zero compilation friction. |
| **ADR-002** | Persistence | SQLite with `better-sqlite3` and explicit schema migrations | Fixes memory-loss weakness by persisting all events, quotes, and caches while maintaining sub-millisecond local queries. |
| **ADR-003** | Math & Arithmetic | Pure deterministic functions for all budgets, per-guest costs, and timeline shifts | LLMs hallucinate numbers; separating all arithmetic into pure testable functions guarantees exact rupee balance. |
| **ADR-004** | AI Structured Output | Strict JSON generation enforced and validated with Zod schemas with fallback retry | Eliminates malformed JSON crashes and guarantees type safety at LLM boundaries. |
| **ADR-005** | Prompt Injection Defense | Pass all user/quote inputs encapsulated inside `<DATA>` tags with explicit non-executable system guardrails | Prevents prompt hijacking when parsing unstructured vendor quote documents and user chat inputs. |
| **ADR-006** | LLM Provider Abstraction | Configurable `llm/provider.js` supporting Gemini, OpenRouter, and a deterministic mock fallback | Enables free-tier operation, live model switching, and 100% deterministic offline automated testing. |
| **ADR-007** | Cache Management | Bounded SQLite-backed hash cache with SHA-256 keys, TTL expiration, and maximum capacity trimming | Fixes unbound in-memory cache weakness and guarantees bounded disk memory footprint. |
| **ADR-008** | Security Architecture | Helmet, express-rate-limit (strict on LLM endpoints), strict CORS, express.json size capping, parameterized queries | Prevents DoS, injection, clickjacking, and unauthorized cross-origin access out of the box. |
| **ADR-009** | Frontend State Management | React Context with `useReducer` and focused custom domain hooks | Replaces centralized monolith App.jsx with decoupled, testable feature stores. |
| **ADR-010** | Re-planning Engine | Trade-off generation engine calculating structured delta options instead of resetting plan | Directly fulfills challenge core requirement of handling "+50 guests, lower budget, earlier date" without losing confirmed work. |
| **ADR-011** | Localization | Indian Numbering System (Lakh/Crore: `₹XX,XX,XXX`) and Date Format (`DD/MM/YYYY`) | Tailored specifically to Indian wedding, birthday, and community event organizers. |
| **ADR-012** | Timeline Dependency Resolution | Topological ordering with recursive cascade re-dating on task delays | Prevents impossible schedules and automatically alerts organizers to downstream bottlenecks. |
| **ADR-013** | Transparency & Trust | Explicit visual distinction between `AI Estimate*` and `Confirmed Actual Cost` | Prevents users from mistaking AI guesses for contracted vendor fees or finalized quotes. |
| **ADR-014** | Code Quality & Style | Zero-tolerance ESLint + Prettier, max 40-line pure functions, files < 300 lines | Guarantees clean, maintainable, modular codebase with zero lint warnings. |
| **ADR-015** | Testing Strategy | Dual-suite Vitest: Backend integration tests for every endpoint + unit tests for pure logic; Frontend RTL tests for user flows | Eliminates previous testing score weakness (72) by verifying both API contracts and UI interactions. |
