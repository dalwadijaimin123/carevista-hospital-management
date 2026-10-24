
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ArrowUpRight,
  Loader2,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AdminCareOpsProps = {
  onClose: () => void;
  overview?: any;
};

type StreamPayload = {
  text?: string;
  message?: string;
};

const prompts = [
  "Give me a 3-step brief for the morning shift.",
  "Where should the admin team look for queue bottlenecks today?",
  "Turn the low-stock list into a priority order.",
];

export default function AdminCareOps({
  onClose,
  overview,
}: AdminCareOpsProps) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  const context = useMemo(
    () =>
      `Dashboard totals: ${
        overview?.stats?.patients ?? 1284
      } active patients, ${
        overview?.stats?.appointments ?? 46
      } appointments, ${
        overview?.stats?.lowStock ?? 7
      } low-stock alerts, ${
        overview?.stats?.occupancy ?? 72
      }% occupancy.`,
    [overview],
  );

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const submit = async (value = message) => {
    const question = value.trim();

    if (question.length < 3 || isLoading) {
      return;
    }

    setMessage(value);
    setAnswer("");
    setError("");
    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/admin/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message: question,
          context,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const problem = (await response
          .json()
          .catch(() => null)) as
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
      let receivedDone = false;
      let hasText = false;

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
            const payload = JSON.parse(
              rawData,
            ) as StreamPayload;

            if (
              typeof payload.text === "string" &&
              payload.text.length > 0
            ) {
              hasText = true;
              setAnswer((current) => current + payload.text);
            }
          } catch {
            // Ignore malformed stream events and continue reading.
          }
        } else if (eventName === "error") {
          try {
            const payload = JSON.parse(
              rawData,
            ) as StreamPayload;

            streamError =
              payload.message ||
              "CareOps is temporarily unavailable. Please try again.";
          } catch {
            streamError =
              "CareOps is temporarily unavailable. Please try again.";
          }
        } else if (eventName === "done") {
          receivedDone = true;
        }
      };

      while (!receivedDone) {
        const { done, value: chunk } = await reader.read();

        buffer += decoder.decode(
          chunk ?? new Uint8Array(),
          { stream: !done },
        );

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
          "CareOps did not return an answer. Please try again.",
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
            : "CareOps is temporarily unavailable. Please try again.",
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

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-160px)] grid-cols-1 gap-5 xl:grid-cols-[.7fr_1.3fr]">
      <Card className="rounded-2xl border-[#e7dfd2] bg-[#fff8ef] p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5d9ae] text-[#9d5b24]">
            <Sparkles className="h-5 w-5" />
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#aa8a6a] hover:bg-[#faecd8]"
            aria-label="Close AI assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8">
          <div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#b77c43]">
            CareOps AI
          </div>

          <h2 className="display-font mt-3 text-3xl font-extrabold leading-tight text-[#4d3320]">
            What should we make clearer?
          </h2>

          <p className="mt-4 text-[12px] leading-6 text-[#8d755e]">
            Get concise operational summaries, priority lists,
            and practical next steps.
          </p>
        </div>

        <div className="mt-10 space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              disabled={isLoading}
              onClick={() => void submit(prompt)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#f1dfc5] bg-white/70 px-3 py-3 text-left text-[11px] font-semibold leading-4 text-[#836b55] hover:border-[#dfbd8b] disabled:opacity-50"
            >
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#d18b47]" />
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-[10px] text-[#aa8e70]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Avoid patient-identifying information.
        </div>
      </Card>

      <Card className="flex flex-col rounded-2xl border-[#e3e6de] bg-white">
        <div className="flex items-center gap-3 border-b border-[#edf0e9] px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]">
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <div className="text-[12px] font-extrabold text-[#35534c]">
              CareOps workspace
            </div>
            <div className="text-[10px] text-[#9aa69f]">
              Operational guidance
            </div>
          </div>

          <span className="ml-auto rounded-full bg-[#e4f1eb] px-2 py-1 text-[9px] font-bold text-[#08796e]">
            {isLoading ? "Generating" : "Ready"}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {answer ? (
            <div
              aria-live="polite"
              className="max-w-2xl whitespace-pre-wrap rounded-2xl bg-[#f5f8f4] p-4 text-[12px] leading-6 text-[#526b63]"
            >
              <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#0b897b]">
                <Sparkles className="h-3 w-3" />
                CareOps response
              </div>

              {answer}

              {isLoading && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-[#0d796f]" />
              )}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f6f2] text-[#49a18f]">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <MessageSquareText className="h-6 w-6" />
                )}
              </div>

              <h3 className="display-font mt-5 text-[17px] font-extrabold text-[#31534b]">
                {isLoading
                  ? "Preparing your brief"
                  : "Start with a shift question"}
              </h3>

              <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#99a59f]">
                {isLoading
                  ? "Your answer will appear here as it is generated."
                  : "Ask about operational priorities, bottlenecks, or inventory."}
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-[11px] leading-5 text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-[#edf0e9] p-4">
          <div className="relative">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CareOps about hospital operations..."
              maxLength={1200}
              className="min-h-[88px] resize-none rounded-xl border-[#dfe7df] bg-[#fbfcf9] pr-12 text-[12px]"
            />

            <Button
              onClick={() => void submit()}
              disabled={isLoading || message.trim().length < 3}
              size="icon"
              className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-[#0d6e65] text-white hover:bg-[#09584f]"
              aria-label="Send question to CareOps AI"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="mt-2 text-[10px] text-[#a1aca6]">
            Press Ctrl + Enter or Cmd + Enter to send.
            Responses are operational guidance, not clinical advice.
          </div>
        </div>
      </Card>
    </div>
  );
}
