/**
 * LLM Prompts with strict prompt injection defense.
 * All untrusted user content and pasted quotation text is strictly encapsulated
 * within <DATA>...</DATA> blocks and treated solely as inert text data.
 */
import { SYSTEM_GUARDRAIL } from './promptGuardrail.js';

export { SYSTEM_GUARDRAIL };

/**
 * Builds prompt for guided intake chat.
 * @param {object} params
 * @returns {string}
 */
export function buildIntakePrompt({ conversationHistory, partialData, currentMessage }) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Guided intake for Indian weddings, birthdays, and community events.
EMPATHY: The user may be a complete beginner. Guide gently, do not interrogate.
RULES:
1. MANDATORY: Occasion, Budget in INR, Guest Count, Date.
2. OPTIONAL: Atmosphere, Theme, Culture. If user says "no", "anything", "none", "flexible", or "you decide", NEVER ask again! Set sensible defaults (e.g. "Warm hospitality & delicious dinner").
3. CONFIRMATION: If user says "yes", "proceed", "ok", or if the 4 mandatory fields are known, set readyToGenerate: true immediately.
4. BUDGET: If budget is modest (e.g. ₹500/guest), suggest suitable formats (home dining / cafe) rather than demanding more money.
5. NO REPETITION: Never ask for information already provided or dismissed in History.

<DATA>
Current Plan State:
${JSON.stringify(partialData || {}, null, 2)}
Conversation History:
${(conversationHistory || []).map((m) => `${m.sender}: ${m.content}`).join('\n')}
Latest User Message:
${currentMessage}
</DATA>

Output JSON schema format:
{
  "reply": "string (warm, proactive. If ready, invite them to view the plan)",
  "missingFields": ["budgetTotal"],
  "readyToGenerate": boolean,
  "planPreview": {
    "title": "string",
    "eventType": "wedding" | "birthday" | "community",
    "budgetTotal": number,
    "guestCount": number,
    "eventDate": "YYYY-MM-DD",
    "priorities": "string"
  }
}`;
}

/**
 * Builds prompt for budget category allocation.
 * @param {object} event - Event record
 * @returns {string}
 */
export function buildBudgetAllocationPrompt(event) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Propose realistic budget allocation percentages for the specified event in India.
The percentages must sum to 100.
Budget Total: ₹${event.budget_total} (${event.budget_total / 100000} Lakhs INR)
Guest Count: ${event.guest_count}
Event Type: ${event.event_type}

Adapt allocations to event type:
- Wedding: Venue & Hospitality (~35-45%), Catering (~25-35%), Decor & Floral (~10-15%), Photography (~8-12%), Music/Entertainment (~5%), Buffer (~5%)
- Birthday: Venue/Activity (~30%), Food/Cake (~35%), Entertainment/Gifts (~20%), Decor (~10%), Buffer (~5%)
- Community Event: Stage/Sound/Permits (~40%), Food/Refreshments (~30%), Logistics/Security (~15%), Signage/Prizes (~10%), Buffer (~5%)

<DATA>
Event Title: ${event.title}
Location: ${event.location || 'India'}
Cultural Context: ${event.cultural_context || 'Standard'}
User Priorities: ${event.priorities || 'Balanced'}
</DATA>

Output JSON schema format:
{
  "rationale": "High-level strategy explaining the split based on guest count and priorities",
  "categories": [
    {
      "category": "Catering",
      "percentage": 30,
      "reasoning": "Covers buffet for ${event.guest_count} guests with standard multi-cuisine spread"
    }
  ]
}`;
}

/**
 * Builds prompt for backward timeline task scheduling.
 * @param {object} event
 * @returns {string}
 */
export function buildTimelinePrompt(event) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Generate a backward task schedule working backward from the event date.
Specify daysBeforeEvent for each task (e.g. 120, 60, 14, 2 days before).
Highlight dependencies using dependsOnTitles.

<DATA>
Event Type: ${event.event_type}
Title: ${event.title}
Event Date: ${event.event_date}
Guest Count: ${event.guest_count}
Priorities: ${event.priorities}
</DATA>

Output JSON schema format:
{
  "tasks": [
    {
      "title": "Book Venue",
      "description": "Lock dates and pay advance deposit",
      "daysBeforeEvent": 90,
      "priority": "high",
      "dependsOnTitles": []
    },
    {
      "title": "Finalize Caterer",
      "description": "Conduct food tasting and sign menu contract",
      "daysBeforeEvent": 75,
      "priority": "high",
      "dependsOnTitles": ["Book Venue"]
    }
  ]
}`;
}

/**
 * Builds prompt for vendor checklist generation.
 * @param {object} event
 * @returns {string}
 */
export function buildVendorCategoriesPrompt(event) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Generate required vendor categories for this ${event.event_type} in India.
For each vendor category, provide requirements to define, questions to ask, documents to collect.

<DATA>
Event: ${event.title} (${event.event_type})
Guests: ${event.guest_count}
Budget: ₹${event.budget_total}
Priorities: ${event.priorities}
</DATA>

Output JSON schema format:
{
  "vendors": [
    {
      "category": "Catering",
      "suggestedName": "Primary Caterer",
      "requirements": ["Live counter power specs", "Per-plate breakdown"],
      "questions": ["Is service staff included?", "What is the overtime rate after 11 PM?"],
      "documents": ["FSSAI certification", "GST registration", "Contract agreement"]
    }
  ]
}`;
}

/**
 * Builds prompt for quote extraction & comparison.
 * @param {string} rawQuoteText
 * @param {object} event
 * @param {object} vendor
 * @param {object} categoryBudget
 * @returns {string}
 */
export function buildQuoteComparisonPrompt({ rawQuoteText, event, vendor, categoryBudget }) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Extract structured quotation details from unstructured vendor proposal text.
Identify total amount, inclusions, hidden/extra charges, and open questions.
Compare against category estimate of ₹${categoryBudget?.estimated_amount || 0}.
Never assume prices are locked or guaranteed.

<DATA>
Raw Vendor Proposal / Quote:
"""${rawQuoteText}"""

Context:
Vendor Category: ${vendor.category}
Event Type: ${event.event_type}
Total Guests: ${event.guest_count}
Allocated Category Budget: ₹${categoryBudget?.estimated_amount || 0}
</DATA>

Output JSON schema format:
{
  "vendorName": "extracted vendor or business name",
  "totalAmount": number,
  "guestsCovered": number,
  "inclusions": ["List of items explicitly included"],
  "extraCharges": ["List of possible extra fees or unquoted items"],
  "openQuestions": ["Questions the organizer should clarify before signing"],
  "budgetFitAssessment": "Brief assessment comparing quote against allocated budget"
}`;
}

/**
 * Builds prompt for personalized ideas.
 * @param {object} event
 * @param {string} [focusArea]
 * @returns {string}
 */
export function buildPersonalizedIdeasPrompt(event, focusArea = 'all') {
  return `${SYSTEM_GUARDRAIL}

GOAL: Propose creative, culturally tailored, and budget-conscious ideas.
Consider age mix (children, youth, adults, elderly), cultural backdrop, and venue accessibility.

<DATA>
Event: ${event.title} (${event.event_type})
Budget: ₹${event.budget_total}
Guests: ${event.guest_count}
Culture: ${event.cultural_context}
Priorities & Atmosphere: ${event.priorities}
Focus Area: ${focusArea}
</DATA>

Output JSON schema format:
{
  "ideas": [
    {
      "category": "Decor" | "Food" | "Entertainment" | "Theme" | "Activity",
      "title": "Specific Idea Title",
      "description": "Concrete execution details, age adaptability, and why it fits",
      "estimatedCostTier": "₹" | "₹₹" | "₹₹₹",
      "tags": ["kid-friendly", "elderly-friendly", "low-cost", "diy"]
    }
  ]
}`;
}

/**
 * Builds prompt for plan revision / trade-offs.
 * @param {object} currentPlan - { budgetTotal, guestCount, eventDate, budgetItems, tasks }
 * @param {object} changeRequest - { budgetTotal, guestCount, eventDate, notes }
 * @returns {string}
 */
export function buildReplanTradeoffsPrompt({ currentPlan, changeRequest }) {
  return `${SYSTEM_GUARDRAIL}

GOAL: Propose 2-3 realistic trade-off options when constraints change (e.g. +50 guests, lower budget, earlier date).
CRITICAL RULE: DO NOT simply cut everything across the board by a fixed percentage.
Present strategic choices with clear consequences so the user stays in control.

<DATA>
CURRENT PLAN:
Budget Total: ₹${currentPlan.budgetTotal}
Guest Count: ${currentPlan.guestCount}
Event Date: ${currentPlan.eventDate}
Current Categories:
${JSON.stringify(currentPlan.budgetItems.map((b) => ({ category: b.category, amount: b.activeAmount, pct: b.percentageOfTotal })), null, 2)}

REQUESTED REVISIONS:
New Budget Total: ₹${changeRequest.budgetTotal}
New Guest Count: ${changeRequest.guestCount}
New Event Date: ${changeRequest.eventDate}
User Notes: ${changeRequest.notes || 'None'}
</DATA>

Output JSON schema format:
{
  "analysis": "Summary of the planning challenge and key tension points",
  "options": [
    {
      "id": "option-1",
      "title": "Clear strategy name",
      "description": "High-level approach summary",
      "strategy": "Explanation of what is protected and what is adjusted",
      "budgetAdjustments": [
        { "category": "Decor", "newPercentage": 8, "reason": "Opt for seasonal marigolds and fairy lights" }
      ],
      "timelineAdjustmentDays": -14,
      "consequences": [
        "Saves ₹50,000 in decor",
        "Must finalize venue contract 10 days earlier"
      ]
    }
  ]
}`;
}
