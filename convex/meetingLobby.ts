import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const requestToJoin = mutation({
  args: {
    callId: v.string(),
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetingLobby")
      .withIndex("by_callId_userId", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      if (existing.status === "rejected") {
        await ctx.db.patch(existing._id, {
          status: "waiting",
        });
      }

      return existing._id;
    }

    return await ctx.db.insert("meetingLobby", {
      callId: args.callId,
      userId: args.userId,
      userName: args.userName,
      status: "waiting",
    });
  },
});

export const getWaitingParticipants = query({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingLobby")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();
  },
});

export const getMyLobbyStatus = query({
  args: {
    callId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingLobby")
      .withIndex("by_callId_userId", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .unique();
  },
});

export const admitParticipant = mutation({
  args: {
    callId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("meetingLobby")
      .withIndex("by_callId_userId", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .unique();

    if (!participant) {
      throw new Error("Participant request not found");
    }

    await ctx.db.patch(participant._id, {
      status: "admitted",
    });
  },
});

export const rejectParticipant = mutation({
  args: {
    callId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("meetingLobby")
      .withIndex("by_callId_userId", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .unique();

    if (!participant) {
      throw new Error("Participant request not found");
    }

    await ctx.db.patch(participant._id, {
      status: "rejected",
    });
  },
});