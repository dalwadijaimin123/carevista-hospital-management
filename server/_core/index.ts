
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { z } from "zod";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import { streamGemini } from "../ai/gemini";
import { serveStatic, setupVite } from "./vite";
import { registerAdminAIStream } from "../ai/adminStream";
import { startReminderJob } from "../reminders";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

const aiStreamInput = z.object({
  task: z.enum(["health", "appointment", "report"]),
  message: z.string().trim().min(3).max(4000),
});

async function startServer() {
  await getDb();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/ai/stream", async (req, res) => {
    const parsed = aiStreamInput.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Enter a question between 3 and 4,000 characters.",
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

        res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
      }

      if (!res.destroyed && !res.writableEnded) {
        res.write("event: done\ndata: {}\n\n");
        res.end();
      }
    } catch (error) {
      console.error(
        "[CareVista AI] Stream endpoint failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      if (!res.destroyed && !res.writableEnded) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            message:
              "The AI service is temporarily unavailable. Please try again.",
          })}\n\n`,
        );

        res.end();
      }
    }
  });

  registerAdminAIStream(app);
  registerStorageProxy(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(
      `Port ${preferredPort} is busy, using port ${port} instead`,
    );
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startReminderJob();
  });
}

startServer().catch((error: unknown) => {
  console.error("[CareVista] Server startup failed:", error);
  process.exitCode = 1;
});
