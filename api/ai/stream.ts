import { askGemini } from "../../server/ai/gemini";

type RequestLike = {
  method?: string;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  write: (chunk: string) => boolean;
  end: () => void;
};

const allowedTasks = new Set(["health", "appointment", "report"]);

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const body = req.body as { task?: unknown; message?: unknown } | undefined;
  const task = body?.task;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (
    typeof task !== "string" ||
    !allowedTasks.has(task) ||
    message.length < 3 ||
    message.length > 4000
  ) {
    res.status(400).json({
      error: "Choose a valid assistant and enter a question between 3 and 4,000 characters.",
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const answer = await askGemini(task as "health" | "appointment" | "report", message);
    // Emit the answer using the same Server-Sent Events format expected by the client.
    res.write(`event: chunk\ndata: ${JSON.stringify({ text: answer })}\n\n`);
    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    console.error(
      "[CareVista AI] Vercel endpoint failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    // Once streaming headers have been sent, return the error as an SSE event.
    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: "The AI service is temporarily unavailable. Please check the server configuration and try again.",
      })}\n\n`,
    );
    res.end();
  }
}
