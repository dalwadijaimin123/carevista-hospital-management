import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, navigate] = useLocation();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [show,setShow]=useState(false); const [error,setError]=useState("");
  const register = trpc.auth.register.useMutation({ onSuccess: () => navigate("/login"), onError: e => setError(e.message) });
  const submit=(e:FormEvent)=>{e.preventDefault();setError("");if(password!==confirm){setError("Passwords do not match.");return;}register.mutate({name:name.trim(),email:email.trim(),password});};
  return <div className="flex min-h-screen items-center justify-center bg-[#103a35] px-5 py-10"><div className="w-full max-w-xl rounded-[28px] bg-[#f7f6f1] p-7 text-[#153a36] shadow-[0_30px_100px_rgba(0,0,0,.3)] sm:p-10">
    <button onClick={()=>navigate("/login")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d817a]"><ArrowLeft className="h-4 w-4"/>Back to Login</button>
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f0ea] text-[#08796e]"><UserPlus className="h-5 w-5"/></div><p className="mt-7 text-[11px] font-bold uppercase tracking-[.2em] text-[#71877f]">Patient registration</p><h1 className="display-font mt-2 text-3xl font-extrabold tracking-[-.05em]">Create your account</h1><p className="mt-3 text-sm text-[#75827d]">Register first. After registration, use your email and password to sign in.</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><div><Label>Full name</Label><Input value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-11 rounded-xl" required/></div><div><Label>Email address</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-11 rounded-xl" required/></div><div><Label>Password</Label><div className="relative mt-2"><Input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-11 rounded-xl pr-11" minLength={8} required/><button type="button" onClick={()=>setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div><p className="mt-1 text-[10px] text-[#87948e]">Use at least 8 characters.</p></div><div><Label>Confirm password</Label><Input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 h-11 rounded-xl" required/></div>{error&&<div className="rounded-xl border border-[#f0c9c1] bg-[#fff0ec] px-3 py-2.5 text-xs font-semibold text-[#a44839]">{error}</div>}<Button type="submit" disabled={register.isPending} className="h-12 w-full rounded-xl bg-[#0e6c63] font-bold text-white">{register.isPending?<><span>Creating account...</span><Loader2 className="h-4 w-4 animate-spin"/></>:<>Create account<ArrowUpRight className="ml-auto h-4 w-4"/></>}</Button></form>
    <p className="mt-6 text-center text-xs text-[#7d8b85]">Already registered? <button onClick={()=>navigate("/login")} className="font-bold text-[#0d766b]">Login here</button></p>
  </div></div>;
}
