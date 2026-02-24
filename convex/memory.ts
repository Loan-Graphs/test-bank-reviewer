import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const memories = await ctx.db.query("subjectMemory").collect();
    return memories.filter((m) => m.subject === args.subject);
  },
});

export const recordMistake = mutation({
  args: {
    subject: v.string(),
    mistakePattern: v.string(),
    exampleQuestion: v.string(),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("subjectMemory", {
      subject: args.subject,
      mistakePattern: args.mistakePattern,
      exampleQuestion: args.exampleQuestion,
      resolution: args.resolution,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjectMemory").collect();
  },
});
