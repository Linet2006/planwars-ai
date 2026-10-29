# LinkedIn Launch Post: PlanWars AI (docs/LINKEDIN_POST.md)

🎉 **Excited to share PlanWars AI — my submission for Prompt Wars Virtual, Challenge 5!**

Organizing large-scale events like multi-day Indian weddings, intergenerational milestone birthdays, or society community festivals is infamous for one thing: **the plan is obsolete the moment reality strikes.**

A caterer quotes 20% over budget, 50 extra relatives RSVP, or municipal venue permits force an event 2 weeks earlier. Most "AI event planners" act like generic party chatbots: they give cute theme ideas and hallucinate budget math. 

We built **PlanWars AI** on a radically different premise: **Inspiration is not Execution. The AI is a disciplined coordinator, not a magician.**

---

### 💡 What GenAI Handled vs. What Plain Code Handled

A core engineering principle was drawing a strict architectural boundary between LLMs and deterministic code:

1. **Where GenAI was used:**
   - 🗣️ **Conversational Guided Intake:** Deduced missing event constraints without asking redundant questions.
   - 📊 **Proportional Strategy:** Proposing category percentage splits tailored to cultural nuances (e.g., higher food & decor weights for weddings vs. heavy audio-visual & security permits for community melas).
   - 📑 **Unstructured Proposal Extraction:** Extracting structured inclusions, hidden extra charges (generator fuel, overtime clauses), and open interview questions from raw vendor emails.
   - 🔀 **Trade-off Strategy Formulation:** Synthesizing 2-3 realistic strategic alternatives when constraints shift, explaining direct consequences instead of naive across-the-board budget cuts.

2. **Where Plain Deterministic Code Handled Everything:**
   - 🧮 **All Arithmetic & Rupees:** The LLM NEVER touches arithmetic. All budget totals, per-guest plate costs, percentage shares, and rupee bounds are calculated by pure, unit-tested JS functions. An 8 Lakh budget will *never* yield a 10 Lakh plan.
   - ⏱️ **Dependency Graphs & Backward Scheduling:** Milestone dates are back-scheduled from the event date using topological sorting. If an upstream prerequisite (like booking a venue) is delayed, downstream tasks cascade automatically.
   - 🔍 **Plan Diffing:** Exact delta calculation between current plan parameters and revisions.

---

### 🛡️ Architecture & Security
- **Stack:** Node 20 (Express, ES Modules), SQLite via `better-sqlite3` with migrations, React 18 + Vite.
- **Defense-in-Depth:** User inputs and vendor text are passed inside strict `<DATA>` XML tags with system guardrails to prevent prompt injection attacks.
- **Bounded Persistence:** Zero in-memory cache loss on server restarts. SQLite-backed bounded LLM response cache with SHA-256 keys and automated LRU/TTL eviction.
- **Strict Validation:** 100% of request bodies and LLM outputs validated with Zod schemas with fallback retry.
- **Production Performance:** Bundle size is under 181 kB (57 kB gzipped) with zero lint warnings and 63 unit and integration tests passing.

---

### 🚀 Key Takeaway
LLMs excel at linguistic parsing, strategy synthesis, and contextual empathy; deterministic engines excel at constraints, exact arithmetic, and dependency graphs. Pairing them together creates AI applications users can actually trust with their life milestones.

Check out the repository and walkthrough: [GitHub Link]

#AI #FullStack #SoftwareEngineering #React #NodeJS #SQLite #PromptEngineering #EventTech #BuildInPublic

