import { ENV } from "./_core/env";
import { CLINIC } from "@shared/clinic";

type AppointmentMail = {
  patientName: string;
  patientEmail?: string | null;
  providerName: string;
  department: string;
  appointmentType: string;
  scheduledAt: number;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const when = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

/** Never throws: a failed e-mail must not break booking. Returns true when sent. */
async function sendMail(to: string, subject: string, heading: string, lines: string[]): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn(`[Email] RESEND_API_KEY not set - skipped "${subject}" to ${to}`);
    return false;
  }
  const baseUrl = ENV.appBaseUrl.replace(/\/$/, "");
  const text = [...lines, "", `Patient portal: ${baseUrl}/user`, `${CLINIC.name} · ${CLINIC.phone}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f7f3;font-family:Arial,sans-serif;color:#173d38"><div style="max-width:560px;margin:24px auto;padding:32px;background:#fff;border:1px solid #e2e8e0;border-radius:16px"><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#0d887b;text-transform:uppercase">${esc(CLINIC.name)}</p><h1 style="font-size:22px">${esc(heading)}</h1>${lines.map((l) => `<p>${esc(l)}</p>`).join("")}<p><a style="color:#0d766b" href="${baseUrl}/user">Open My appointments</a></p><p style="font-size:12px;color:#82918b">${esc(CLINIC.address)} · ${esc(CLINIC.phone)}</p></div></body></html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: ENV.passwordResetFrom, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error(`[Email] Provider rejected "${subject}" (${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

export function sendBookingConfirmed(a: AppointmentMail) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Your CareVista appointment is confirmed", "Appointment confirmed", [
    `Hello ${a.patientName}, your appointment is confirmed.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Type: ${a.appointmentType}`,
    `When: ${when(a.scheduledAt)}`,
    "Please arrive 10 minutes early. To cancel or change, use My appointments in the patient portal.",
  ]);
}

export function sendWaitlistJoined(a: AppointmentMail, queuePosition: number) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "You are on the CareVista waiting list", "Added to the waiting list", [
    `Hello ${a.patientName}, the slot you chose was already booked, so you were added to the waiting list.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Requested time: ${when(a.scheduledAt)}`,
    `Your position: #${queuePosition}`,
    "If the slot becomes free you will be confirmed automatically and we will email you right away.",
  ]);
}

/** Sent when a waiting patient is automatically moved into a freed slot. */
export function sendWaitlistPromoted(a: AppointmentMail) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Good news - your CareVista appointment is confirmed", "Your slot is now confirmed", [
    `Hello ${a.patientName}, a slot became available and your waiting-list request is now CONFIRMED.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Type: ${a.appointmentType}`,
    `When: ${when(a.scheduledAt)}`,
    "If you can no longer attend, please cancel from My appointments so the next patient can be seated.",
  ]);
}

export function sendRescheduled(a: AppointmentMail) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Your CareVista appointment was rescheduled", "Appointment rescheduled", [
    `Hello ${a.patientName}, your appointment has been moved to a new time.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `New time: ${when(a.scheduledAt)}`,
    "Your previous time was released. If this was not you, please contact the hospital.",
  ]);
}

/** Sent about 24 hours before the visit. */
export function sendReminder(a: AppointmentMail) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Reminder: your CareVista appointment is tomorrow", "Appointment reminder", [
    `Hello ${a.patientName}, this is a reminder of your upcoming appointment.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Type: ${a.appointmentType}`,
    `When: ${when(a.scheduledAt)}`,
    "Please arrive 10 minutes early. Cannot come? Cancel or reschedule from My appointments so another patient can take the slot.",
  ]);
}
