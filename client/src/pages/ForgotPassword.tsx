import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type Stage = "email" | "code" | "done";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtp = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setStage("code");
      setOtp("");
      setError("");
      setNotice("If a normal user account exists for this email, a six-digit code has been sent. Check your inbox and spam folder.");
      setResendSeconds(60);
    },
    onError: (mutationError) => setError(mutationError.message || "Unable to send a verification code. Please try again."),
  });

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setStage("done");
      setError("");
      setNotice("Your password has been changed successfully. You can now sign in with your new password.");
    },
    onError: (mutationError) => setError(mutationError.message || "Unable to reset your password. Please check the code and try again."),
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    requestOtp.mutate({ email: email.trim() });
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    resetPassword.mutate({ email: email.trim(), otp, password });
  };

  return (
    <div className="grid-paper flex min-h-screen items-center justify-center overflow-hidden bg-[#0d2927] px-5 py-10 text-white">
      <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#0b776d] opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#e89c51] opacity-20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#123a36]/80 shadow-[0_30px_100px_rgba(0,0,0,.35)] lg:grid-cols-[1fr_.9fr]">
        <div className="hidden border-r border-white/10 px-12 py-14 lg:block"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e4ad6d] text-[#143431]"><Activity className="h-6 w-6" /></div><span className="display-font text-lg font-extrabold tracking-[-.04em]">CareVista Hospital</span></div><div className="mt-20 max-w-lg"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#8bd4c7]">Account recovery</p><h1 className="display-font mt-5 text-5xl font-extrabold leading-[1.05] tracking-[-.06em]">A secure way back into your account.</h1><p className="mt-6 max-w-md text-[15px] leading-7 text-[#b7ceca]">Verify your registered email with a one-time code, then choose a new password. The code expires after 10 minutes.</p></div><div className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 text-[12px] text-[#a9c3be]"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Email verification</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> One-time code</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Time limited</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Password hashed on server</div></div></div>

        <div className="bg-[#f7f6f1] px-7 py-9 text-[#153a36] sm:px-10 sm:py-12">
          <button type="button" onClick={() => navigate("/login")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d817a] hover:text-[#0e6c63]"><ArrowLeft className="h-4 w-4" /> Back to sign in</button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f0ea] text-[#08796e]">{stage === "done" ? <CheckCircle2 className="h-5 w-5" /> : stage === "email" ? <Mail className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}</div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[.2em] text-[#71877f]">Normal user account</p>
          <h2 className="display-font mt-3 text-3xl font-extrabold tracking-[-.05em]">{stage === "done" ? "Password updated" : stage === "email" ? "Forgot password?" : "Verify your email"}</h2>
          <p className="mt-3 text-sm leading-6 text-[#75827d]">{stage === "done" ? "Your account is ready to use with the new password." : stage === "email" ? "Enter the email address used when registering your CareVista account." : `Enter the six-digit code sent to ${email.trim()}. Then choose a new password.`}</p>

          {stage === "email" && <form onSubmit={submitEmail} className="mt-7 space-y-5"><div><Label htmlFor="reset-email" className="text-xs font-bold text-[#48645c]">Registered email address</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 rounded-xl border-[#dfe5dd] bg-white text-sm shadow-none focus-visible:ring-[#8fcfc2]" required /></div>{error && <div role="alert" className="rounded-xl border border-[#f0c9c1] bg-[#fff0ec] px-3 py-2.5 text-xs font-semibold leading-5 text-[#a44839]">{error}</div>}<Button type="submit" disabled={requestOtp.isPending} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 text-sm font-bold text-white hover:bg-[#09584f]">{requestOtp.isPending ? <><span>Sending code...</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>Send verification code</span><ArrowRight className="h-4 w-4" /></>}</Button></form>}

          {stage === "code" && <form onSubmit={submitPassword} className="mt-7 space-y-4"><div><Label htmlFor="reset-otp" className="text-xs font-bold text-[#48645c]">Six-digit verification code</Label><Input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="mt-2 h-12 rounded-xl border-[#dfe5dd] bg-white text-center text-lg font-bold tracking-[.35em] shadow-none focus-visible:ring-[#8fcfc2]" required /></div><div><Label htmlFor="new-password" className="text-xs font-bold text-[#48645c]">New password</Label><div className="relative mt-2"><Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={200} placeholder="At least 8 characters" className="h-11 rounded-xl border-[#dfe5dd] bg-white pr-11 text-sm shadow-none focus-visible:ring-[#8fcfc2]" required /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#91a09a] hover:bg-[#edf2ed]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div><Label htmlFor="confirm-password" className="text-xs font-bold text-[#48645c]">Confirm new password</Label><Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={200} placeholder="Re-enter new password" className="mt-2 h-11 rounded-xl border-[#dfe5dd] bg-white text-sm shadow-none focus-visible:ring-[#8fcfc2]" required /></div>{error && <div role="alert" className="rounded-xl border border-[#f0c9c1] bg-[#fff0ec] px-3 py-2.5 text-xs font-semibold leading-5 text-[#a44839]">{error}</div>}<Button type="submit" disabled={resetPassword.isPending} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 text-sm font-bold text-white hover:bg-[#09584f]">{resetPassword.isPending ? <><span>Updating password...</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>Verify code and reset password</span><ArrowRight className="h-4 w-4" /></>}</Button><div className="flex flex-col gap-2 pt-1 text-center text-xs"><button type="button" disabled={requestOtp.isPending || resendSeconds > 0} onClick={() => { setError(""); requestOtp.mutate({ email: email.trim() }); }} className="font-bold text-[#0d766b] disabled:cursor-not-allowed disabled:text-[#9aa59f]">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend verification code"}</button><button type="button" onClick={() => { setStage("email"); setError(""); setNotice(""); setOtp(""); }} className="text-[#7d8b85] hover:text-[#0d766b]">Use a different email address</button></div></form>}

          {stage === "done" && <div className="mt-7 space-y-4"><div className="rounded-xl border border-[#cfe5d7] bg-[#edf8f1] p-4 text-sm leading-6 text-[#2d7057]">{notice}</div><Button onClick={() => navigate("/login")} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 text-sm font-bold text-white hover:bg-[#09584f]">Back to sign in <ArrowRight className="h-4 w-4" /></Button></div>}

          {notice && stage !== "done" && <p role="status" className="mt-4 rounded-xl border border-[#cfe5d7] bg-[#edf8f1] px-3 py-3 text-xs leading-5 text-[#2d7057]">{notice}</p>}
          <div className="mt-6 flex items-center gap-2 text-[11px] text-[#8a9690]"><ShieldCheck className="h-4 w-4 text-[#2a9a86]" /> Never share your verification code with anyone.</div>
        </div>
      </div>
    </div>
  );
}
