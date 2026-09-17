import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  googleTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  googleCalendarEvents: defineTable({
    userId: v.string(),
    callId: v.string(),
    googleEventId: v.string(),
    googleEventLink: v.optional(v.string()),
  })
    .index("by_callId", ["callId"])
    .index("by_userId", ["userId"]),

  meetingLobby: defineTable({
    callId: v.string(),
    userId: v.string(),
    userName: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("admitted"),
      v.literal("rejected")
    ),
  })
    .index("by_callId", ["callId"])
    .index("by_callId_userId", ["callId", "userId"]),
});