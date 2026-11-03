import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    login.mutate({ email: email.trim(), password });
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#071f24] via-[#103c37] to-[#18554a] px-4 py-8 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#0b776d] opacity-40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#e89c51] opacity-20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/15 bg-[#123a36]/80 shadow-2xl lg:grid-cols-[1.1fr_.9fr]">
        <aside className="hidden border-r border-white/10 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4ad6d] text-[#143431]">
              <Activity className="h-6 w-6" />
            </span>
            <span className="display-font text-xl font-extrabold">CareVista Hospital</span>
          </div>

          <div className="my-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9ee3d3]">Patient portal</p>
            <p className="display-font mt-4 text-5xl font-extrabold leading-tight tracking-tight">
              Your care, all in one place.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#c5ded8]">
              Sign in to access your CareVista account and manage your appointments.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#c5ded8]">
            <ShieldCheck className="h-5 w-5 text-[#9ee3d3]" />
            Secure account access
          </div>
        </aside>

        <section className="bg-[#fbfdfb] p-6 text-[#153a36] sm:p-10">
          <button type="button" onClick={() => navigate("/")} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#43665c] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e2f0ea] text-[#08796e]">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#426e62]">CareVista patient portal</p>
          <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#526a62]">
            Enter the email and password you used to register.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-11 rounded-xl border-[#c8ded4] bg-white focus-visible:ring-[#81c8b7]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="h-11 rounded-xl border-[#c8ded4] bg-white pr-11 focus-visible:ring-[#81c8b7]"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#43665c] hover:bg-[#edf5f1]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm font-semibold text-[#0d766b] hover:underline">
                Forgot password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}

            <Button type="submit" disabled={login.isPending} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 font-bold text-white hover:bg-[#09584f]">
              {login.isPending ? (
                <>Signing in… <Loader2 className="h-4 w-4 animate-spin" /></>
              ) : (
                <>Sign in <ArrowUpRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#526a62]">
            New to CareVista?{" "}
            <button type="button" onClick={() => navigate("/register")} className="font-bold text-[#0d766b] hover:underline">
              Create an account
            </button>
          </p>

          <div className="mt-5 border-t border-[#dce9e2] pt-5">
            <Button type="button" variant="outline" onClick={() => navigate("/admin-login")} className="h-11 w-full rounded-xl border-[#c8ded4] font-semibold text-[#17695f] hover:bg-[#edf5f1]">
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}