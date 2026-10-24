import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Activity, ArrowLeft, ArrowUpRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async (result) => {
      utils.auth.me.setData(undefined, result.user as any);
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (err) => {
      setError(err.message || "Unable to sign in. Please check your credentials.");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="grid-paper flex min-h-screen items-center justify-center overflow-hidden bg-[#0d2927] px-5 py-10 text-white">
      <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#0b776d] opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#e89c51] opacity-20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#123a36]/80 shadow-[0_30px_100px_rgba(0,0,0,.35)] lg:grid-cols-[1.15fr_.85fr]">
        <div className="hidden border-r border-white/10 px-12 py-14 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e4ad6d] text-[#143431]"><Activity className="h-6 w-6" /></div>
            <span className="display-font text-lg font-extrabold tracking-[-.04em]">CareVista Hospital</span>
          </div>
          <div className="mt-20 max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#8bd4c7]">Hospital management system</p>
            <h1 className="display-font mt-5 text-5xl font-extrabold leading-[1.05] tracking-[-.06em]">Welcome back to your hospital command center.</h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[#b7ceca]">Sign in with your administrator account to manage patients, appointments, pharmacy inventory, and hospital operations.</p>
          </div>
          <div className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 text-[12px] text-[#a9c3be]">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Secure session</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Admin-only access</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Patient flow</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#81d2bf]" /> Inventory alerts</div>
          </div>
        </div>

        <div className="bg-[#f7f6f1] px-7 py-9 text-[#153a36] sm:px-10 sm:py-12">
          <button onClick={() => navigate("/")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d817a] hover:text-[#0e6c63]">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f0ea] text-[#08796e]"><LockKeyhole className="h-5 w-5" /></div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[.2em] text-[#71877f]">Secure account access</p>
          <h2 className="display-font mt-3 text-3xl font-extrabold tracking-[-.05em]">Sign in</h2>
          <p className="mt-3 text-sm leading-6 text-[#75827d]">Sign in with your registered user account. Administrator access is available from the Admin Login link above.</p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs font-bold text-[#48645c]">Email address</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hospital.com" className="mt-2 h-11 rounded-xl border-[#dfe5dd] bg-white text-sm shadow-none focus-visible:ring-[#8fcfc2]" required />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-bold text-[#48645c]">Password</Label>
              <div className="relative mt-2">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="h-11 rounded-xl border-[#dfe5dd] bg-white pr-11 text-sm shadow-none focus-visible:ring-[#8fcfc2]" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#91a09a] hover:bg-[#edf2ed] hover:text-[#41655d]" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="-mt-2 flex justify-end">
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs font-bold text-[#0d766b] hover:underline">
                Forgot password? Reset with OTP
              </button>
            </div>

            {error && <div className="rounded-xl border border-[#f0c9c1] bg-[#fff0ec] px-3 py-2.5 text-xs font-semibold leading-5 text-[#a44839]">{error}</div>}

            <Button type="submit" disabled={login.isPending} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(14,108,99,.22)] hover:bg-[#09584f]">
              {login.isPending ? <><span>Signing in...</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>Sign in securely</span><ArrowUpRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">

  <p className="text-xs text-[#7d8b85]">
    New user?{" "}
    <button
      onClick={() => navigate("/register")}
      className="font-extrabold text-[#0d766b]"
    >
      Register here
    </button>
  </p>

  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-[#e2e7e1]" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa59f]">
      OR
    </span>
    <div className="h-px flex-1 bg-[#e2e7e1]" />
  </div>

  <Button
    type="button"
    onClick={() => navigate("/admin-login")}
    variant="outline"
    className="h-11 w-full rounded-xl border-[#cfe1da] text-xs font-bold text-[#17695f] hover:bg-[#edf5f1]"
  >
    <ShieldCheck className="mr-2 h-4 w-4" />
    Admin Login
  </Button>

</div>
          <div className="mt-5 flex items-center gap-2 text-[11px] text-[#8a9690]"><ShieldCheck className="h-4 w-4 text-[#2a9a86]" /> Registered accounts only · secure local authentication</div>
        </div>
      </div>
    </div>
  );
}
