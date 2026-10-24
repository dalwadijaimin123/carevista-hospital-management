import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { getDb } from "./db";
import { registerAdminAIStream } from "./ai/adminStream";

const app = express();
app.use(express.json({ limit: "4mb" }));

let ready: Promise<unknown> | null = null;
app.use(async (_req, _res, next) => {
  try {
    ready ??= getDb();
    await ready;
    next();
  } catch (e) {
    ready = null;
    next(e);
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