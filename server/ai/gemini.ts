
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from the server environment.");
}

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

const gemini = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 30_000,
  },
});

export type AITask = "health" | "appointment" | "report" | "admin";

const instructions: Record<AITask, string> = {
  health: [
    "You are CareVista's AI Health Assistant.",
    "Respond in clear, simple English.",
    "Give general health information only.",
    "Do not diagnose conditions or prescribe medicines.",
    "For possible emergencies, advise immediate medical attention.",
    "Keep responses concise, practical, and easy to understand.",
  ].join(" "),

  appointment: [
    "You are CareVista's Appointment Assistant.",
    "Respond in clear, simple English.",
    "Help users identify relevant hospital departments and understand appointment booking.",
    "Do not claim an appointment has been booked unless the application confirms it.",
    "Keep responses concise and practical.",
  ].join(" "),

  report: [
    "You are CareVista's Medical Report Assistant.",
    "Explain medical terms in simple English.",
    "Consider the provided units and laboratory reference ranges.",
    "Do not diagnose conditions or prescribe treatment.",
    "Recommend discussing results with a qualified healthcare professional.",
    "Keep responses concise.",
  ].join(" "),

  admin: [
    "You are CareVista's Hospital Administration Assistant.",
    "Respond in clear, concise English.",
    "Never claim to have accessed or changed hospital records unless the application explicitly confirms that action.",
    "Do not invent hospital statistics or patient information.",
  ].join(" "),
};

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getConfig(task: AITask, model: string) {
  const thinkingLevel = model.includes("flash-lite")
    ? ThinkingLevel.MINIMAL
    : ThinkingLevel.LOW;

  return {
    systemInstruction: instructions[task],
    thinkingConfig: {
      thinkingLevel,
    },
    maxOutputTokens: task === "report" ? 360 : 280,
  };
}

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryable(errorText: string): boolean {
  return /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL/i.test(
    errorText,
  );
}

function logDuration(label: string, startedAt: number, model: string): void {
  console.log(
    `[CareVista AI] ${label}: ${Date.now() - startedAt}ms | model=${model}`,
  );
}

export async function askGemini(
  task: AITask,
  message: string,
): Promise<string> {
  const model = getModel();
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startedAt = Date.now();

    try {
      console.log(
        `[CareVista AI] Request started | attempt=${attempt}/${maxAttempts} | model=${model}`,
      );

      const response = await gemini.models.generateContent({
        model,
        contents: message,
        config: getConfig(task, model),
      });

      const answer = response.text?.trim();

      logDuration("Request completed", startedAt, model);

      if (!answer) {
        throw new Error("Gemini returned an empty response.");
      }

      return answer;
    } catch (error) {
      const errorText = getErrorText(error);

      console.error(
        `[CareVista AI] Attempt ${attempt} failed: ${errorText}`,
      );

      if (!isRetryable(errorText) || attempt === maxAttempts) {
        throw error;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error("Gemini request failed after retries.");
}

export async function* streamGemini(
  task: AITask,
  message: string,
): AsyncGenerator<string, void, unknown> {
  const model = getModel();
  const startedAt = Date.now();

  let firstChunkReceived = false;
  let emittedText = false;

  try {
    const responseStream = await gemini.models.generateContentStream({
      model,
      contents: message,
      config: getConfig(task, model),
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;

      if (!text) {
        continue;
      }

      if (!firstChunkReceived) {
        firstChunkReceived = true;
        logDuration("First text chunk", startedAt, model);
      }

      emittedText = true;
      yield text;
    }

    if (!emittedText) {
      throw new Error("Gemini returned an empty response.");
    }

    logDuration("Stream completed", startedAt, model);
  } catch (error) {
    console.error(
      `[CareVista AI] Streaming failed: ${getErrorText(error)}`,
    );

    throw error;
  }
}
