import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    subject: v.optional(v.string()),
    reviewStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let questions = await ctx.db.query("questions").collect();
    if (args.subject) {
      questions = questions.filter((q) => q.subject === args.subject);
    }
    if (args.reviewStatus) {
      questions = questions.filter((q) => q.reviewStatus === args.reviewStatus);
    }
    return questions;
  },
});

export const getNextPending = query({
  args: { subject: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let questions = await ctx.db.query("questions").collect();
    questions = questions.filter((q) => q.reviewStatus === "pending");
    if (args.subject) {
      questions = questions.filter((q) => q.subject === args.subject);
    }
    return questions[0] ?? null;
  },
});

export const getProgress = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("questions").collect();
    const total = all.length;
    const approved = all.filter((q) => q.reviewStatus === "approved").length;
    const overridden = all.filter((q) => q.reviewStatus === "overridden").length;
    const skipped = all.filter((q) => q.reviewStatus === "skipped").length;
    const pending = all.filter((q) => q.reviewStatus === "pending").length;

    // Per-subject breakdown
    const subjects: Record<string, { total: number; done: number }> = {};
    all.forEach((q) => {
      if (!subjects[q.subject]) subjects[q.subject] = { total: 0, done: 0 };
      subjects[q.subject].total++;
      if (q.reviewStatus !== "pending") subjects[q.subject].done++;
    });

    return { total, approved, overridden, skipped, pending, subjects };
  },
});

export const review = mutation({
  args: {
    questionId: v.id("questions"),
    action: v.string(), // "approve" | "override" | "skip"
    humanNote: v.optional(v.string()),
    reviewer: v.string(),
  },
  handler: async (ctx, args) => {
    const statusMap: Record<string, string> = {
      approve: "approved",
      override: "overridden",
      skip: "skipped",
    };
    await ctx.db.patch(args.questionId, {
      reviewStatus: statusMap[args.action] || "approved",
      reviewedBy: args.reviewer,
      reviewedAt: new Date().toISOString(),
      humanNote: args.humanNote,
    });
    return { success: true };
  },
});

export const updateClaudeVerdict = mutation({
  args: {
    questionId: v.id("questions"),
    verdict: v.string(),
    confidence: v.number(),
    explanation: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      claudeVerdict: args.verdict,
      claudeConfidence: args.confidence,
      claudeExplanation: args.explanation,
      claudeEvaluatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const importMockData = mutation({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("questions").collect();
    if (existing.filter((q) => q.subject === args.subject).length > 0) {
      return { seeded: false };
    }

    // Mock Q&A pairs for testing
    const mockQuestions = [
      {
        question: "What is the maximum DTI ratio allowed for a conventional loan?",
        correctAnswer: "45% (up to 50% with compensating factors)",
        options: ["36%", "43%", "45%", "50%"],
        subject: args.subject,
      },
      {
        question: "What does LTV stand for in mortgage lending?",
        correctAnswer: "Loan-to-Value ratio",
        options: ["Loan-to-Value ratio", "Lender-to-Vendor ratio", "Loan-Term-Volume ratio", "None of the above"],
        subject: args.subject,
      },
      {
        question: "What is the minimum credit score for an FHA loan with 3.5% down?",
        correctAnswer: "580",
        options: ["500", "580", "620", "640"],
        subject: args.subject,
      },
      {
        question: "What is PITI in mortgage terms?",
        correctAnswer: "Principal, Interest, Taxes, Insurance",
        options: ["Principal, Interest, Title, Insurance", "Principal, Interest, Taxes, Insurance", "Payment, Insurance, Tax, Income", "None of the above"],
        subject: args.subject,
      },
      {
        question: "What is a non-QM loan?",
        correctAnswer: "A loan that does not meet the Consumer Financial Protection Bureau's Qualified Mortgage standards",
        options: [
          "A loan that does not meet the Consumer Financial Protection Bureau's Qualified Mortgage standards",
          "A loan that is not backed by government agencies",
          "A loan with no mortgage insurance",
          "A loan for non-residents",
        ],
        subject: args.subject,
      },
      {
        question: "What is the conforming loan limit for 2024 in most U.S. counties?",
        correctAnswer: "$766,550",
        options: ["$647,200", "$726,200", "$766,550", "$806,500"],
        subject: args.subject,
      },
      {
        question: "Which government agency backs VA loans?",
        correctAnswer: "Department of Veterans Affairs",
        options: ["FHA", "USDA", "Department of Veterans Affairs", "Fannie Mae"],
        subject: args.subject,
      },
      {
        question: "What does APR stand for?",
        correctAnswer: "Annual Percentage Rate",
        options: ["Annual Percentage Rate", "Average Prime Rate", "Adjusted Periodic Rate", "Annual Payment Ratio"],
        subject: args.subject,
      },
      {
        question: "What is the purpose of Private Mortgage Insurance (PMI)?",
        correctAnswer: "To protect the lender if the borrower defaults when the down payment is less than 20%",
        options: [
          "To protect the borrower from foreclosure",
          "To protect the lender if the borrower defaults when the down payment is less than 20%",
          "To insure the property against damage",
          "To cover the title in case of disputes",
        ],
        subject: args.subject,
      },
      {
        question: "What is amortization in the context of a mortgage?",
        correctAnswer: "The gradual repayment of a loan through regular payments that cover both principal and interest",
        options: [
          "The process of calculating interest only",
          "The gradual repayment of a loan through regular payments that cover both principal and interest",
          "A refinance strategy to lower payments",
          "The transfer of a mortgage to a new borrower",
        ],
        subject: args.subject,
      },
    ];

    for (const q of mockQuestions) {
      await ctx.db.insert("questions", {
        ...q,
        reviewStatus: "pending",
        sheetId: undefined,
        rowIndex: undefined,
      });
    }

    // Record import session
    await ctx.db.insert("importSessions", {
      sheetId: "mock-data",
      sheetName: "Mock Data",
      subject: args.subject,
      status: "done",
      questionsImported: mockQuestions.length,
      importedAt: new Date().toISOString(),
      importedBy: "system",
      isMockData: true,
    });

    return { seeded: true, count: mockQuestions.length };
  },
});
