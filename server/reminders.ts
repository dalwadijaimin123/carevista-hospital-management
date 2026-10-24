import { ENV } from "./_core/env";
import { claimDueReminders, releaseReminder } from "./db";
import { sendReminder } from "./appointmentEmail";

const INTERVAL_MS = 30 * 60 * 1000;
let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

async function runOnce() {
  if (running) return;
  running = true;
  try {
    const due = await claimDueReminders();
    for (const appointment of due) {
      const sent = await sendReminder(appointment);
      if (!sent) await releaseReminder(appointment.id); // retry on the next run
    }
    if (due.length > 0) console.log(`[Reminders] Processed ${due.length} reminder(s).`);
  } catch (error) {
    console.error("[Reminders] Run failed:", error instanceof Error ? error.message : "Unknown error");
  } finally {
    running = false;
  }
}

/** Checks every 30 minutes for appointments starting within 24 hours. */
export function startReminderJob() {
  if (timer) return;
  if (!ENV.resendApiKey) {
    console.warn("[Reminders] RESEND_API_KEY is not set - appointment reminder e-mails are disabled.");
    return;
  }
  setTimeout(() => void runOnce(), 15_000);
  timer = setInterval(() => void runOnce(), INTERVAL_MS);
  timer.unref?.();
}
