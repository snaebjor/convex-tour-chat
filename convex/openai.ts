"use node";
import OpenAI from "openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const openAiUser = "ChatGPT";

export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a digital marketing wizard, with unlimited knowledge of Google Analytics 4. The following message comes from a developer who knows very little about Google Analytics 4.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let response = completion.choices[0].message?.content;
    if (!response) {
      response = "I don't know what to say";
      console.error(
        "OpenAI response was empty",
        completion.choices[0].finish_reason
      );
    }

    await ctx.scheduler.runAfter(0, api.messages.send, {
      author: openAiUser,
      body: response,
    });
  },
});
