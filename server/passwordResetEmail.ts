import { ENV } from "./_core/env";

/** Sends account-recovery codes through Resend without exposing the code to the browser. */
export async function sendPasswordResetOtp(email: string, otp: string): Promise<void> {
  if (!ENV.resendApiKey) {
    throw new Error("Password reset email delivery is not configured. Set RESEND_API_KEY in .env.");
  }

  const baseUrl = ENV.appBaseUrl.replace(/\/$/, "");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.passwordResetFrom,
      to: [email],
      subject: "Your CareVista password reset code",
      text: [
        "You requested to reset your CareVista Hospital account password.",
        "",
        `Your one-time verification code is: ${otp}`,
        "This code expires in 10 minutes and can be used only once.",
        "If you did not request this code, you can ignore this email.",
        "",
        `Open the password reset page: ${baseUrl}/forgot-password`,
      ].join("\n"),
      html: `<!doctype html><html><body style="margin:0;background:#f5f7f3;font-family:Arial,sans-serif;color:#173d38"><div style="max-width:560px;margin:24px auto;padding:32px;background:#fff;border:1px solid #e2e8e0;border-radius:16px"><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#0d887b;text-transform:uppercase">CareVista Hospital</p><h1 style="font-size:24px">Reset your password</h1><p>You requested to reset the password for your CareVista account. Enter this one-time code on the password reset page:</p><div style="margin:24px 0;padding:18px;text-align:center;background:#edf5f0;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:8px;color:#0e6c63">${otp}</div><p>This code expires in <strong>10 minutes</strong> and can be used only once.</p><p>If you did not request this code, you can safely ignore this email.</p><p><a style="color:#0d766b" href="${baseUrl}/forgot-password">Open password reset</a></p></div></body></html>`,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const providerMessage = await response.text().catch(() => "");
    console.error(`[Password Reset] Email provider rejected the request (${response.status}).`, providerMessage.slice(0, 300));
    throw new Error("Could not send password reset email.");
  }
}
