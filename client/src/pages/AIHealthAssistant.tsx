
import { useEffect, useRef, useState } from "react";
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
}[] = [
  {
    value: "health",
    label: "Health Assistant",
    description: "General health information and self-care guidance",
  },
  {
    value: "appointment",
    label: "Department Guide",
    description: "Find a potentially relevant hospital department",
  },
  {
    value: "report",
    label: "Report Explainer",
    description: "Understand medical terms and laboratory values",
  },
];

export default function AIHealthAssistant() {
  const [, navigate] = useLocation();

  const [task, setTask] = useState<AITask>("health");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task,
          message: question,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;

        throw new Error(
          problem?.error ||
            problem?.message ||
            "The AI request could not be completed.",
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this connection.",
        );
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

            if (
              typeof payload.text === "string" &&
              payload.text.length > 0
            ) {
              hasText = true;

              setAnswer((current) => current + payload.text);
            }
          } catch {
            // Ignore malformed events and continue reading the stream.
          }
        } else if (eventName === "error") {
          try {
            const payload = JSON.parse(rawData) as StreamPayload;

            streamError =
              payload.message ||
              "The AI service is temporarily unavailable. Please try again.";
          } catch {
            streamError =
              "The AI service is temporarily unavailable. Please try again.";
          }
        } else if (eventName === "done") {
          receivedDone = true;
        }
      };

      while (!receivedDone) {
        const { done, value } = await reader.read();

        buffer += decoder.decode(value ?? new Uint8Array(), {
          stream: !done,
        });

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
        throw new Error(
          "The AI did not return an answer. Please try again.",
        );
      }
    } catch (requestError) {
      const wasAborted =
        requestError instanceof Error &&
        requestError.name === "AbortError";

      if (!wasAborted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The AI service is temporarily unavailable. Please try again.",
        );
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#173d38]">
      <header className="border-b border-[#e2e8e1] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Button>

          <span className="flex items-center gap-2 font-bold">
            <HeartPulse className="h-5 w-5 text-[#0d796f]" />
            CareVista AI
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff1e9] text-[#0d796f]">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="display-font mt-5 text-4xl font-extrabold">
            AI Health Assistant
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#71857c]">
            Ask a general health question, explore a hospital department,
            or understand medical terminology.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e0e8df] bg-white p-6 shadow-sm sm:p-8">
          <label className="mb-2 block text-sm font-bold">
            What would you like help with?
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            {taskOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTask(option.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  task === option.value
                    ? "border-[#0d796f] bg-[#e8f4ee]"
                    : "border-[#e1e7e0] hover:bg-[#f8faf7]"
                }`}
              >
                <span className="block text-sm font-bold">
                  {option.label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#788980]">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6">
            <label
              htmlFor="ai-question"
              className="mb-2 block text-sm font-bold"
            >
              Your question
            </label>

            <Textarea
              id="ai-question"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                task === "health"
                  ? "Ask a general health question..."
                  : task === "appointment"
                    ? "Describe your symptoms without personal details..."
                    : "Enter a test name, value, unit, and reference range..."
              }
              className="min-h-32 rounded-xl"
              maxLength={4000}
              required
            />

            <p className="mt-2 text-right text-xs text-[#8a9991]">
              {message.length}/4000
            </p>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || message.trim().length < 3}
              className="mt-4 h-12 w-full rounded-xl bg-[#0e6c63] font-bold hover:bg-[#09584f]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating your answer...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ask CareVista AI
                </>
              )}
            </Button>
          </form>

          {answer && (
            <section
              aria-live="polite"
              className="mt-6 rounded-2xl border border-[#dce9df] bg-[#f5faf6] p-5"
            >
              <h2 className="font-bold">AI Response</h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {answer}
                {isLoading && (
                  <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-[#0d796f]" />
                )}
              </p>
            </section>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-6 text-[#7d8c84]">
          This assistant provides general information only. It does not
          diagnose conditions or prescribe treatment. Do not enter names,
          contact details, patient IDs, or other identifying medical data.
          For emergencies, seek immediate medical care.
        </p>
      </section>
    </main>
  );
}
