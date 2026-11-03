import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const inputClassName =
  "h-11 rounded-xl border-[#c8ded4] bg-white focus-visible:ring-[#81c8b7]";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const register = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/login"),
    onError: (err) => setError(err.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    register.mutate({ name: name.trim(), email: email.trim(), password });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#071f24] via-[#103c37] to-[#18554a] px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full max-w-xl rounded-[28px] border border-white/30 bg-[#fbfdfb] p-6 text-[#153a36] shadow-2xl sm:p-10">
        <button type="button" onClick={() => navigate("/login")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#43665c] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e2f0ea] text-[#08796e]">
          <UserPlus className="h-5 w-5" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#426e62]">Patient registration</p>
        <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-[#526a62]">
          Create a CareVista account to book and manage appointments.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`mt-2 ${inputClassName}`}
              required
            />
          </div>

          <div>
            <Label htmlFor="register-email">Email address</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`mt-2 ${inputClassName}`}
              required
            />
          </div>

          <div>
            <Label htmlFor="register-password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-describedby="password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClassName} pr-11`}
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#43665c] hover:bg-[#edf5f1]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="password-hint" className="mt-1.5 text-xs text-[#526a62]">
              Use at least 8 characters.
            </p>
          </div>

          <div>
            <Label htmlFor="register-confirm">Confirm password</Label>
            <Input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`mt-2 ${inputClassName}`}
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}

          <Button type="submit" disabled={register.isPending} className="h-12 w-full justify-between rounded-xl bg-[#0e6c63] px-4 font-bold text-white hover:bg-[#09584f]">
            {register.isPending ? (
              <>Creating account… <Loader2 className="h-4 w-4 animate-spin" /></>
            ) : (
              <>Create account <ArrowUpRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#526a62]">
          Already registered?{" "}
          <button type="button" onClick={() => navigate("/login")} className="font-bold text-[#0d766b] hover:underline">
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}