import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const queue = await ctx.db.query("evaluationQueue").collect();
    return {
      total: queue.length,
      queued: queue.filter((q) => q.status === "queued").length,
      processing: queue.filter((q) => q.status === "processing").length,
      done: queue.filter((q) => q.status === "done").length,
      failed: queue.filter((q) => q.status === "failed").length,
    };
  },
});

export const enqueueAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Queue all questions that haven't been Claude-evaluated yet
    const questions = await ctx.db.query("questions").collect();
    const unevaluated = questions.filter((q) => !q.claudeVerdict);

    const existingQueue = await ctx.db.query("evaluationQueue").collect();
    const alreadyQueued = new Set(existingQueue.map((e) => e.questionId));

    let count = 0;
    for (const q of unevaluated) {
      if (!alreadyQueued.has(q._id)) {
        await ctx.db.insert("evaluationQueue", {
          questionId: q._id,
          status: "queued",
          queuedAt: new Date().toISOString(),
        });
        count++;
      }
    }
    return { enqueued: count };
  },
});

export const getNextQueued = query({
  args: {},
  handler: async (ctx) => {
    const queue = await ctx.db.query("evaluationQueue").collect();
    return queue.find((q) => q.status === "queued") ?? null;
  },
});

export const markProcessing = mutation({
  args: { queueId: v.id("evaluationQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, { status: "processing" });
  },
});

export const markDone = mutation({
  args: { queueId: v.id("evaluationQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, {
      status: "done",
      processedAt: new Date().toISOString(),
    });
  },
});

export const markFailed = mutation({
  args: { queueId: v.id("evaluationQueue"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, {
      status: "failed",
      error: args.error,
      processedAt: new Date().toISOString(),
    });
  },
});
