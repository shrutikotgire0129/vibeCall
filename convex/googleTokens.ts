import { mutation, query  } from "./_generated/server";
import { v } from "convex/values";

export const saveGoogleTokens = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiryDate,
      });

      return existing._id;
    }

    return await ctx.db.insert("googleTokens", {
      userId: args.userId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiryDate: args.expiryDate,
    });
  },
});

export const getGoogleTokens = query({
  args: {
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const saveGoogleCalendarEvent = mutation({
  args: {
    userId: v.string(),
    callId: v.string(),
    googleEventId: v.string(),
    googleEventLink: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarEvents")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        googleEventId: args.googleEventId,
        googleEventLink: args.googleEventLink,
      });

      return existing._id;
    }

    return await ctx.db.insert("googleCalendarEvents", {
      userId: args.userId,
      callId: args.callId,
      googleEventId: args.googleEventId,
      googleEventLink: args.googleEventLink,
    });
  },
});

export const getGoogleCalendarEvent = query({
  args: {
    callId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleCalendarEvents")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
  },
});

export const deleteGoogleCalendarEvent = mutation({
  args: {
    callId: v.string(),
  },

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarEvents")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);

    return existing._id;
  },
});

export const deleteGoogleTokens = mutation({
  args: {
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);

    return existing._id;
  },
});

