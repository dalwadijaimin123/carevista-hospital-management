
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { getDb } from "./db";
import { registerAdminAIStream } from "./ai/adminStream";
import { streamGemini } from "./ai/gemini";

const app = express();

app.use(express.json({ limit: "4mb" }));

let ready: Promise<unknown> | null = null;

app.use(async (_req, _res, next) => {
  try {
    ready ??= getDb();
    await ready;
    next();
  } catch (error) {
    ready = null;
    next(error);
  }
});

app.post("/api/ai/stream", async (req, res) => {
  const schema = z.object({
    task: z.enum(["health", "appointment", "report"]),
    message: z.string().trim().min(3).max(1200),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please enter a valid message.",
    });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    for await (const text of streamGemini(
      parsed.data.task,
      parsed.data.message,
    )) {
      if (res.destroyed || res.writableEnded) {
        return;
      }

      res.write(
        `event: chunk\ndata: ${JSON.stringify({ text })}\n\n`,
      );
    }

    if (!res.destroyed && !res.writableEnded) {
      res.write("event: done\ndata: {}\n\n");
      res.end();
    }
  } catch (error) {
    console.error(
      "[CareVista AI] Stream route failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    if (!res.destroyed && !res.writableEnded) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          message: "AI request failed. Please try again.",
        })}\n\n`,
      );
      res.end();
    }
  }
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

registerAdminAIStream(app);

export default app;
