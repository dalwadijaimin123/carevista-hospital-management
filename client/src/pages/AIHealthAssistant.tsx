import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, HeartPulse, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AITask = "health" | "appointment" | "report";

type StreamPayload = {
  text?: string;
  message?: string;
};

const taskOptions: {
  value: AITask;
  label: string;
  description: string;
  placeholder: string;
}[] = [
  {
    value: "health",
    label: "Health Assistant",
    description: "General health information and self-care guidance.",
    placeholder: "Ask a general health question...",
  },
  {
    value: "appointment",
    label: "Department Guide",
    description: "Explore which hospital department may be relevant.",
    placeholder: "Describe your symptoms without personal details...",
  },
  {
    value: "report",
    label: "Report Explainer",
    description: "Get help understanding medical terms and lab values.",
    placeholder: "Enter a test name, value, unit, and reference range...",
  },
];

const streamErrorMessage =
  "The AI service is temporarily unavailable. Please try again.";

export default function AIHealthAssistant() {
  const [, navigate] = useLocation();
  const [task, setTask] = useState<AITask>("health");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const selectedTask = taskOptions.find((option) => option.value === task);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = message.trim();

    if (question.length < 3 || isLoading) {
      return;
    }

    setAnswer("");
    setError("");
    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, message: question }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;

        throw new Error(
          problem?.error || problem?.message || "The AI request could not be completed.",
        );
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this connection.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let streamError = "";
      let hasText = false;
      let receivedDone = false;

      const processEvent = (block: string) => {
        let eventName = "message";
        const dataLines: string[] = [];

        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (dataLines.length === 0) {
          return;
        }

        const rawData = dataLines.join("\n");

        if (eventName === "chunk") {
          try {
            const payload = JSON.parse(rawData) as StreamPayload;
            const text = payload.text;

            if (typeof text === "string" && text.length > 0) {
              hasText = true;
              setAnswer((current) => current + text);
            }
          } catch {
            // Ignore malformed chunks and keep reading the stream.
          }
        } else if (eventName === "error") {
          try {
            const payload = JSON.parse(rawData) as StreamPayload;
            streamError = payload.message || streamErrorMessage;
          } catch {
            streamError = streamErrorMessage;
          }
        } else if (eventName === "done") {
          receivedDone = true;
        }
      };

      while (!receivedDone) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          processEvent(block);
        }

        if (streamError) {
          await reader.cancel();
          throw new Error(streamError);
        }

        if (done) {
          if (buffer.trim()) {
            processEvent(buffer);
          }
          break;
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!hasText) {
        throw new Error("The AI did not return an answer. Please try again.");
      }
    } catch (requestError) {
      const wasAborted =
        requestError instanceof Error && requestError.name === "AbortError";

      if (!wasAborted) {
        setError(requestError instanceof Error ? requestError.message : streamErrorMessage);
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e2f4ee] via-[#f6fbf8] to-white text-[#173d38]">
      <header className="border-b border-[#dce9e2] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Button type="button" variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>

          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <HeartPulse className="h-5 w-5 text-[#0d796f]" />
            CareVista AI
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-12">
        <section className="mb-6 rounded-3xl bg-gradient-to-br from-[#103c37] to-[#14685a] px-5 py-9 text-center text-white shadow-lg sm:px-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#dff1e9] text-[#0d796f]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="display-font mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            AI Health Assistant
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#d4eee6]">
            Ask a general health question, explore hospital departments, or look up medical terms.
          </p>
        </section>

        <section className="rounded-3xl border border-[#dce9e2] bg-white p-4 shadow-lg shadow-emerald-950/5 sm:p-8">
          <fieldset>
            <legend className="mb-3 text-sm font-bold">What would you like help with?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {taskOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={task === option.value}
                  onClick={() => setTask(option.value)}
                  className={`rounded-xl border p-4 text-left transition hover:border-[#0d796f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d796f] ${
                    task === option.value
                      ? "border-[#0d796f] bg-[#e8f4ee]"
                      : "border-[#dce9e2] hover:bg-[#f6fbf8]"
                  }`}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#526e64]">{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <form onSubmit={submit} className="mt-6">
            <label htmlFor="ai-question" className="mb-2 block text-sm font-bold">
              Your question
            </label>
            <Textarea
              id="ai-question"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={selectedTask?.placeholder}
              className="min-h-32 rounded-xl border-[#c8ded4] bg-[#fbfefc] focus-visible:ring-[#81c8b7]"
              maxLength={4000}
              required
            />

            <p className="mt-2 text-right text-xs text-[#526e64]">
              {message.length}/4000
            </p>

            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || message.trim().length < 3}
              className="mt-4 h-12 w-full rounded-xl bg-[#0e6c63] font-bold text-white hover:bg-[#09584f]"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating your answer…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Ask CareVista AI</>
              )}
            </Button>
          </form>

          {answer && (
            <section aria-live="polite" className="mt-6 rounded-2xl border border-[#c8ded4] bg-[#f5faf6] p-5">
              <h2 className="font-bold">AI Response</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                {answer}
                {isLoading && (
                  <span aria-hidden="true" className="ml-1 inline-block h-4 w-1 animate-pulse bg-[#0d796f]" />
                )}
              </p>
            </section>
          )}
        </section>

        <p className="mt-5 rounded-2xl border border-[#dce9e2] bg-white px-4 py-3 text-xs leading-6 text-[#526e64]">
          This assistant provides general information only. It does not diagnose conditions or prescribe treatment.
          Do not enter names, contact details, patient IDs, or other identifying medical data.
          For emergencies, seek immediate medical care.
        </p>
      </div>
    </main>
  );
}