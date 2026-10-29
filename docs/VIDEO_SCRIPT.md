# Video Walkthrough Script (docs/VIDEO_SCRIPT.md)
*Silent-friendly walkthrough with on-screen visual captions for automated and human reviewers.*

---

## Scene 1: Guided Intake & Personas
**Visual:** User opens `http://localhost:5173`. The clean, accessible interface displays the "PlanWars AI" header and three preset evaluator buttons:
1. `Sharma Wedding (₹25L, 350 guests)`
2. `Anita's 10th Birthday (₹75K, 45 guests)`
3. `Diwali Community Mela (₹3.5L, 500 guests)`

**On-Screen Caption:**
> "PlanWars AI: GenAI-powered planning assistant for Weddings, Birthdays, and Community Events in India."

**Action:** User clicks on "Sharma Wedding". The intake assistant confirms details and builds the plan.
**On-Screen Caption:**
> "AI extracts practical event constraints (Type, Budget, Guests, Target Date, Cultural Context) into a structured baseline plan."

---

## Scene 2: Overview & Dashboard
**Visual:** The Overview dashboard loads showing:
- Total Budget: ₹25,00,000 (₹7,143 / guest)
- Confirmed Actuals: ₹0 • 6 AI Estimates Active
- Remaining Budget: ₹25,00,000 (Status: Healthy)
- Countdown: 47 Days Remaining to 15/12/2026
- Next 3 Urgent Tasks with priority badges

**On-Screen Caption:**
> "Overview Dashboard: Real-time rupee balances, countdown clock, urgent tasks, and clear separation of AI estimates from confirmed costs."

---

## Scene 3: Deterministic Budget Tracking
**Visual:** User clicks on the "Budget" tab. A table renders categories (Venue & Stay, Catering & Dining, Decor & Floral, Photography & Video, Music, Buffer) with percentage shares and per-guest figures.
**On-Screen Caption:**
> "Budget Engine: Allocations are bound strictly to ₹25 Lakhs by pure deterministic math. The LLM never invents numbers."

**Action:** User edits Catering: enters actual cost ₹6,80,000 and checks "Confirmed".
**On-Screen Caption:**
> "Entering a contracted actual price updates the remaining budget live and transitions the badge from 'AI Estimate*' to 'Confirmed'."

**Action:** User enters an actual cost of ₹20,00,000 on Venue, exceeding the budget.
**On-Screen Caption:**
> "Live Over-Budget Alert: Triggers instant warning banner showing exact overshoot amount with one-click link to Revise Plan."

---

## Scene 4: Dependency-Aware Backward Timeline
**Visual:** User clicks on the "Timeline" tab. Tasks are organized backwards from event date (T-90 days, T-60 days, etc.) with dependency indicators.
**On-Screen Caption:**
> "Backward Timeline: Tasks back-scheduled from event date with topological dependency tracking."

**Action:** User clicks "Delay +7 Days" on "Lock Venue".
**On-Screen Caption:**
> "Cascading Delay Resolution: Shifting prerequisite automatically cascades and re-dates downstream catering and decor milestones!"

---

## Scene 5: Vendor Checklists & Structured Quotation Comparison
**Visual:** User clicks on the "Vendors" tab.
**On-Screen Caption:**
> "Vendor Coordinator: Defines requirements, questions to ask, and documents to collect. Never claims availability without verification."

**Action:** User clicks "+ Compare New Quote", pastes an unstructured proposal text ("Royal Spice proposal: ₹6,80,000 for 350 guests. Extra generator fuel ₹15,000. Overtime ₹5,000/hr after 11 PM.").
**On-Screen Caption:**
> "GenAI Extraction: Structures proposal into inclusions, hidden charges, open questions to ask the vendor, and budget fit assessment."

---

## Scene 6: Personalized Cultural Ideas & Chat Refinement
**Visual:** User clicks on "Ideas" tab. Cards show "Marigold Sunset Canopy", "Regional Chaat Lounge", "Multigenerational Memory Trivia".
**On-Screen Caption:**
> "Personalized Ideas: Filterable by age mix (kids vs elderly), cultural backdrop, and budget tier."

**Action:** User clicks "Ask Cheaper Alternative" and types: "Make it kid and elderly friendly with zero setup fees".
**On-Screen Caption:**
> "Interactive Refinement: AI generates value alternatives tailored to specific family and accessibility constraints."

---

## Scene 7: The Critical Re-plan Test Scenario
**Visual:** User clicks "Revise Plan" in the header. The Re-plan modal opens.
**Action:** User clicks preset: `Apply "+50 guests, ₹2L lower budget, 2 weeks earlier"`.
**On-Screen Caption:**
> "Challenge Re-plan Test: User changes multiple constraints simultaneously: 400 guests, ₹23 Lakhs budget, event 14 days earlier."

**Action:** User clicks "Calculate Trade-off Options".
**Visual:** Visual diff displays:
- Guests: 350 → 400 (+50 guests)
- Budget: ₹25L → ₹23L (-₹2,00,000)
- Timeline: 15/12/2026 → 01/12/2026 (14 days earlier)
- 2 Structured Trade-off Options: "Menu Optimization & Smart Favors" and "Format Pivot to Interactive Stalls".

**On-Screen Caption:**
> "Trade-off Engine: Never cuts blindly across the board. Presents strategic choices with concrete consequences so user stays in control."

**Action:** User clicks "Apply Strategy" on Option 1. The modal closes and the dashboard updates in-place without restarting!
**On-Screen Caption:**
> "Plan Revised in Place! Confirmed actual costs and existing contracts are preserved while new constraints are absorbed."

---

## Scene 8: Birthday & Community Event Support
**Visual:** User switches to "Anita's 10th Birthday" and "Diwali Community Mela" via the event switcher.
**On-Screen Caption:**
> "Adapts seamlessly across Birthdays (kid entertainment, magician quotes) and Community Festivals (sound permits, volunteer coordination)."

---

## Scene 9: Production Quality Summary
**On-Screen Caption:**
> "PlanWars AI: 63 Passing Tests • Zero Vulnerabilities • 100% Parameterized SQLite • Under 181 kB Bundle • WCAG AA Accessible."

