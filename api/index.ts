import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { getDb } from "../server/db";
import { registerAdminAIStream } from "../server/ai/adminStream";
// aa ma /api/ai/stream no handler pan move karvo padse

const app = express();
app.use(express.json({ limit: "4mb" }));

import { z } from "zod";
import { streamGemini } from "../server/ai/gemini";

app.post("/api/ai/stream", async (req, res) => {
  const parsed = z.object({
    task: z.enum(["health", "appointment", "report"]),
    message: z.string().trim().min(3).max(4000),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a question between 3 and 4,000 characters." });
    return;
  }
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.flushHeaders();
  try {
    for await (const text of streamGemini(parsed.data.task, parsed.data.message)) {
      res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
    }
    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch {
    res.write(`event: error\ndata: ${JSON.stringify({ message: "The AI service is temporarily unavailable." })}\n\n`);
    res.end();
  }
});

registerAdminAIStream(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

let ready: Promise<unknown> | null = null;
app.use(async (_req, _res, next) => {
  ready ??= getDb();
  await ready;
  next();
});

export default app;