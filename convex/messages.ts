import { api } from "./_generated/api";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const messages = await ctx.db.query("messages").order("desc").take(100);

    const messagesWithLikes = await Promise.all(
      messages.map(async (message) => {
        // Grab the likes for each message.
        const likes = await ctx.db
          .query("likes")
          .withIndex("byMessageId", (q) => q.eq("messageId", message._id))
          .collect();

        return { ...message, likes: likes.length };
      })
    );

    return messagesWithLikes.reverse().map((message) => ({
      ...message,
      body: message.body.replace(/:\)/g, "😊"),
    }));
  },
});

export const send = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, { body, author }) => {
    // Send a new message.
    await ctx.db.insert("messages", { body, author });

    if (body.startsWith("@gpt") && author !== "ChatGPT") {
      await ctx.scheduler.runAfter(0, api.openai.chat, { message: body });
    }
  },
});

export const like = mutation({
  args: { messageId: v.id("messages"), liker: v.string() },
  handler: async (ctx, { messageId, liker }) => {
    // Like a message.
    await ctx.db.insert("likes", { messageId, liker });
  },
});
