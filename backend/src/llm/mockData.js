/**
 * Mock LLM deterministic domain responses for offline testing and evaluation.
 */

export const MOCK_RESPONSES = Object.freeze({
  weddingBudget: {
    rationale: 'Balanced allocation prioritizing venue hospitality, catering, and decor.',
    categories: [
      { category: 'Venue & Stay', percentage: 40, reasoning: 'Covers banquet halls and guest rooms' },
      { category: 'Catering & Dining', percentage: 28, reasoning: 'Multi-course regional buffet & live chaat counters' },
      { category: 'Decor & Floral', percentage: 14, reasoning: 'Eco-friendly marigolds, fairy lights, and stage design' },
      { category: 'Photography & Video', percentage: 8, reasoning: 'Candid photographer and cinematic wedding film' },
      { category: 'Music & Entertainment', percentage: 5, reasoning: 'DJ setup and traditional dhol players' },
      { category: 'Contingency Buffer', percentage: 5, reasoning: 'Unforeseen expenses and emergency buffer' }
    ]
  },
  birthdayBudget: {
    rationale: 'Child-centric party allocation with interactive games and customized cake.',
    categories: [
      { category: 'Venue & Play Area', percentage: 35, reasoning: 'Indoor play zone / banquet hall rental' },
      { category: 'Food & Cake', percentage: 35, reasoning: 'Kids snacks, themed cake, and adult buffet' },
      { category: 'Entertainment & Magic Show', percentage: 15, reasoning: 'Magician, balloon artist, and games host' },
      { category: 'Decor & Theme Favors', percentage: 10, reasoning: 'Balloon arch and customized return gift bags' },
      { category: 'Contingency Buffer', percentage: 5, reasoning: 'Emergency buffer' }
    ]
  },
  communityBudget: {
    rationale: 'Focus on public audio-visual stage setup, municipal permissions, and community snacks.',
    categories: [
      { category: 'Stage, Sound & Lighting', percentage: 40, reasoning: 'Generator backup, sound console, and stage truss' },
      { category: 'Refreshments & Stalls', percentage: 30, reasoning: 'High tea snacks, drinking water stations, and sweets' },
      { category: 'Logistics, Security & Permits', percentage: 15, reasoning: 'Police/fire clearance, private security guards' },
      { category: 'Prizes, Banners & Signage', percentage: 10, reasoning: 'Entry banners, award trophies, and directional boards' },
      { category: 'Contingency Buffer', percentage: 5, reasoning: 'Weather protection contingency' }
    ]
  },
  timelineTasks: [
    { title: 'Lock Venue & Pay Advance', description: 'Finalize contract and confirm dates', daysBeforeEvent: 90, priority: 'high', dependsOnTitles: [] },
    { title: 'Book Caterer & Taste Menu', description: 'Select starters and confirm guest plate count', daysBeforeEvent: 60, priority: 'high', dependsOnTitles: ['Lock Venue & Pay Advance'] },
    { title: 'Finalize Decor & Stage Specs', description: 'Review floral palette and lighting setup', daysBeforeEvent: 45, priority: 'medium', dependsOnTitles: ['Lock Venue & Pay Advance'] },
    { title: 'Send Invitations & Collect RSVPs', description: 'Dispatch digital/print invites to guests', daysBeforeEvent: 30, priority: 'high', dependsOnTitles: ['Lock Venue & Pay Advance'] },
    { title: 'Vendor Rehearsal & Final Walkthrough', description: 'Coordinate sound check, timings, and delivery slots', daysBeforeEvent: 3, priority: 'high', dependsOnTitles: ['Book Caterer & Taste Menu', 'Finalize Decor & Stage Specs'] }
  ],
  vendorCategories: [
    {
      category: 'Catering',
      suggestedName: 'Royal Spice Caterers',
      requirements: ['Live counter power backup', 'Separate vegetarian prep area'],
      questions: ['Is service cutlery included?', 'What is the overtime rate after 11 PM?'],
      documents: ['FSSAI Food Safety Certificate', 'GST Registration']
    },
    {
      category: 'Decor & Styling',
      suggestedName: 'Festive Bloom Designers',
      requirements: ['Fireproof fabric materials', 'Setup access 6 hours prior'],
      questions: ['Do you handle dismantling?', 'Are floral replacements included if wilting?'],
      documents: ['Itemized Quotation', 'Damage Liability Waiver']
    },
    {
      category: 'Sound & Production',
      suggestedName: 'Vibe Audio Tech',
      requirements: ['JBL VRX Line Array speakers', '2 cordless microphones'],
      questions: ['Do you provide sound operator?', 'Is sound permit assistance included?'],
      documents: ['Equipment Rental Agreement', 'ID Proof of Technicians']
    }
  ],
  quoteComparison: {
    vendorName: 'Royal Spice Caterers',
    totalAmount: 680000,
    guestsCovered: 350,
    inclusions: ['4 Starters', '6 Main Courses', '2 Desserts', 'Service Staff', 'Buffet Counters'],
    extraCharges: ['₹15,000 generator fuel charge', '₹5,000 venue cleaning deposit'],
    openQuestions: ['Is mineral water / beverage station included?', 'What is the refund policy if guest count is adjusted 10 days before?'],
    budgetFitAssessment: 'Comfortably within the ₹7,00,000 catering allocation (leaves ₹20,000 buffer).'
  },
  personalizedIdeas: [
    { category: 'Decor', title: 'Marigold Sunset Canopy', description: 'Locally grown yellow and orange marigolds with warm fairy lights. Biodegradable and vibrant.', estimatedCostTier: '₹', tags: ['eco-friendly', 'budget-saver', 'traditional'] },
    { category: 'Food', title: 'Live Regional Chaat & Chai Lounge', description: 'Interactive counter serving pani puri, kachori, and kulhad masala chai. Popular across all generations.', estimatedCostTier: '₹₹', tags: ['kid-friendly', 'elderly-friendly', 'popular'] },
    { category: 'Activity', title: 'Multigenerational Memory Trivia', description: 'Custom trivia cards placed on dinner tables connecting elders with younger guests through family or community lore.', estimatedCostTier: '₹', tags: ['low-cost', 'elderly-friendly', 'icebreaker'] }
  ],
  replanTradeoffs: {
    analysis: 'Guest count increased while budget and timeline were reduced. Selective rationalization of decor and menu format required.',
    options: [
      {
        id: 'option-1',
        title: 'Menu Optimization & Smart Favors',
        description: 'Streamline buffet courses to 4 and replace luxury gift hampers with eco-friendly seed packets.',
        strategy: 'Protects venue comfort while adjusting variable per-plate and gifting costs.',
        budgetAdjustments: [
          { category: 'Decor & Floral', newPercentage: 11, reason: 'Shift to reusable LED lights and local marigolds' },
          { category: 'Contingency Buffer', newPercentage: 4, reason: 'Tighten contingency' }
        ],
        timelineAdjustmentDays: -14,
        consequences: ['Absorbs 50 additional guests within the reduced budget', 'Must lock catering headcount 7 days earlier than usual']
      },
      {
        id: 'option-2',
        title: 'Format Pivot & Digital Favors',
        description: 'Shift catering to interactive food stations and replace live band with DJ setup.',
        strategy: 'Reduces heavy setup labor and frees budget for additional attendees.',
        budgetAdjustments: [
          { category: 'Music & Entertainment', newPercentage: 3, reason: 'Curated DJ playlist instead of live ensemble' }
        ],
        timelineAdjustmentDays: -14,
        consequences: ['Frees ₹60,000 for guest hospitality', 'Sound checks must be coordinated quickly on event morning']
      }
    ]
  }
});

