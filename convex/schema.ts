import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Q&A pairs imported from Google Sheets (or mock data)
  questions: defineTable({
    subject: v.string(),
    question: v.string(),
    correctAnswer: v.string(),
    options: v.optional(v.array(v.string())), // For MCQ
    sheetId: v.optional(v.string()), // Source sheet reference
    rowIndex: v.optional(v.number()),
    // Claude's pre-evaluation
    claudeVerdict: v.optional(v.string()), // "correct" | "incorrect" | "needs_review"
    claudeConfidence: v.optional(v.number()), // 0-100
    claudeExplanation: v.optional(v.string()),
    claudeEvaluatedAt: v.optional(v.string()),
    // Human review
    reviewStatus: v.string(), // "pending" | "approved" | "overridden" | "skipped"
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    humanNote: v.optional(v.string()),
    // Sync back to sheets
    syncedToSheet: v.optional(v.boolean()),
  }),

  // Per-subject memory: tracks Claude mistakes to improve future prompts
  subjectMemory: defineTable({
    subject: v.string(),
    mistakePattern: v.string(),
    exampleQuestion: v.string(),
    resolution: v.string(),
    createdAt: v.string(),
  }),

  // Batch evaluation queue
  evaluationQueue: defineTable({
    questionId: v.id("questions"),
    status: v.string(), // "queued" | "processing" | "done" | "failed"
    queuedAt: v.string(),
    processedAt: v.optional(v.string()),
    error: v.optional(v.string()),
  }),

  // Import sessions
  importSessions: defineTable({
    sheetId: v.string(),
    sheetName: v.string(),
    subject: v.string(),
    status: v.string(), // "pending" | "importing" | "done" | "failed"
    questionsImported: v.number(),
    importedAt: v.string(),
    importedBy: v.string(), // "lauren"
    isMockData: v.optional(v.boolean()),
  }),
});
