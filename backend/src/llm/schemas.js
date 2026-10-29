import { z } from 'zod';

export const IntakeChatSchema = z.object({
  reply: z.string().min(1),
  missingFields: z.array(z.string()).default([]),
  readyToGenerate: z.boolean().default(false),
  planPreview: z
    .object({
      title: z.string().optional(),
      eventType: z.enum(['wedding', 'birthday', 'community']).optional(),
      budgetTotal: z.number().nonnegative().optional(),
      guestCount: z.number().positive().optional(),
      eventDate: z.string().optional(),
      priorities: z.string().optional()
    })
    .optional()
});

export const BudgetCategoryItemSchema = z.object({
  category: z.string().min(1),
  percentage: z.number().min(0).max(100),
  reasoning: z.string().default('')
});

export const BudgetAllocationSchema = z.object({
  rationale: z.string().min(1),
  categories: z.array(BudgetCategoryItemSchema).min(3)
});

export const TimelineTaskItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  daysBeforeEvent: z.number().int().min(0),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  dependsOnTitles: z.array(z.string()).default([])
});

export const TimelineTasksSchema = z.object({
  tasks: z.array(TimelineTaskItemSchema).min(3)
});

export const VendorRequirementItemSchema = z.object({
  category: z.string().min(1),
  suggestedName: z.string().default(''),
  requirements: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([])
});

export const VendorCategoriesSchema = z.object({
  vendors: z.array(VendorRequirementItemSchema).min(2)
});

export const QuoteComparisonSchema = z.object({
  vendorName: z.string().min(1),
  totalAmount: z.number().nonnegative(),
  guestsCovered: z.number().int().nonnegative().default(0),
  inclusions: z.array(z.string()).default([]),
  extraCharges: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  budgetFitAssessment: z.string().default('')
});

export const IdeaItemSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedCostTier: z.string().default('₹₹'),
  tags: z.array(z.string()).default([])
});

export const PersonalizedIdeasSchema = z.object({
  ideas: z.array(IdeaItemSchema).min(2)
});

export const ReplanOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  strategy: z.string().min(1),
  budgetAdjustments: z
    .array(
      z.object({
        category: z.string(),
        newPercentage: z.number().min(0).max(100),
        reason: z.string()
      })
    )
    .default([]),
  timelineAdjustmentDays: z.number().int().default(0),
  consequences: z.array(z.string()).min(1)
});

export const ReplanTradeoffsSchema = z.object({
  analysis: z.string().min(1),
  options: z.array(ReplanOptionSchema).min(2)
});

