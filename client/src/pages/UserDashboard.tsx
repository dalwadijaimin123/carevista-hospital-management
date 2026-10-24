import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, CalendarDays, LogOut, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { CLINIC } from "@shared/clinic";
import { toast } from "sonner";

export default function UserDashboard() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();
  const utils = trpc.useUtils();
  const myAppointments = trpc.appointments.mine.useQuery(undefined, { enabled: Boolean(user) && user?.role !== "admin", refetchInterval: 30000 });
  const cancel = trpc.appointments.cancel.useMutation({
    onSuccess: () => { toast.success("Appointment cancelled."); utils.appointments.mine.invalidate(); },
    onError: (error) => toast.error(error.message || "Could not cancel the appointment."),
  });
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f8f7f2]">Loading...</div>;
  if (!user) { navigate("/login"); return null; }
  if (user.role === "admin") { navigate("/admin"); return null; }
  const signOut = async () => { await logout(); navigate("/"); };
  return <div className="min-h-screen bg-[#f8f7f2] text-[#173d38]">
    <header className="border-b border-[#e3e6df] bg-white/80"><div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d5e57] text-white"><Activity className="h-5 w-5" /></div><div className="display-font text-lg font-extrabold">CareVista Hospital <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-[#82918b]">Patient Portal</span></div></div><Button variant="outline" onClick={signOut} className="rounded-xl font-bold"><LogOut className="mr-2 h-4 w-4" /> Logout</Button></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><div className="rounded-[28px] bg-[#103a35] p-7 text-white sm:p-10"><div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#91d5c8]">Welcome to your portal</p><h1 className="display-font mt-3 text-4xl font-extrabold tracking-[-.05em]">Hello, {user.name?.split(" ")[0] || "Patient"}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#b9d1cb]">Manage your appointments and view your hospital services from one simple account.</p></div><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-7 w-7 text-[#9bd8cb]" /></div></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><PortalCard icon={CalendarDays} title="Appointments" text="View and manage your upcoming appointments." /><PortalCard icon={Stethoscope} title="Departments" text="Explore doctors and hospital departments." /><PortalCard icon={ShieldCheck} title="Account security" text="Your patient account is separate from administrator tools." /></div>
      <MyAppointments rows={myAppointments.data ?? []} loading={myAppointments.isLoading} onBook={() => navigate("/")} onCancel={(id) => { if (window.confirm("Cancel this appointment?")) cancel.mutate({ id }); }} cancelling={cancel.isPending} />
      <div className="mt-6 rounded-2xl border border-[#e1e6df] bg-white p-6"><h2 className="display-font text-xl font-extrabold">Need hospital assistance?</h2><p className="mt-2 text-sm leading-6 text-[#7c8c85]">Contact the hospital reception for appointment or service support.</p><Button onClick={() => navigate("/")} className="mt-5 rounded-xl bg-[#0d6e65] font-bold text-white hover:bg-[#09584f]">Back to home <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    </main>
  </div>;
}
function PortalCard({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) { return <div className="rounded-2xl border border-[#e2e6df] bg-white p-6 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]"><Icon className="h-5 w-5" /></div><h3 className="display-font mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-xs leading-6 text-[#82918b]">{text}</p></div>; }

function MyAppointments({ rows, loading, onBook, onCancel, cancelling }: { rows: any[]; loading: boolean; onBook: () => void; onCancel: (id: string) => void; cancelling: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const waiting = rows.filter(row => row.status === "waiting");
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const promoted = rows.filter(row => row.status === "scheduled" && row.promotedAt && Date.now() - row.promotedAt < WEEK && row.scheduledAt > Date.now());
  const badge = (row: any) => row.status === "waiting"
    ? { text: `Waiting list #${row.queuePosition}`, cls: "bg-[#fff0dd] text-[#b56b2d]" }
    : row.status === "cancelled" ? { text: "Cancelled", cls: "bg-[#fdeceb] text-[#b0463b]" }
    : row.status === "completed" ? { text: "Completed", cls: "bg-[#eef1f0] text-[#768680]" }
    : { text: row.status.replaceAll("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), cls: "bg-[#e2f1eb] text-[#08796e]" };
  return <div className="mt-6 rounded-2xl border border-[#e1e6df] bg-white p-6">
    <div className="flex items-center justify-between"><h2 className="display-font text-xl font-extrabold">My appointments</h2><Button onClick={onBook} variant="outline" className="rounded-xl text-xs font-bold">Book new</Button></div>
    {promoted.map(row => <p key={row.id} className="mt-3 rounded-xl bg-[#e2f6ec] px-4 py-3 text-xs leading-5 text-[#0b6b52]">Good news! A slot opened up and your appointment with {row.providerName} on {new Date(row.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} is now confirmed. We also sent you an e-mail.</p>)}
    {waiting.length > 0 && <p className="mt-3 rounded-xl bg-[#fff6e6] px-4 py-3 text-xs leading-5 text-[#9a6a1f]">You are on the waiting list for {waiting.length} appointment{waiting.length > 1 ? "s" : ""}. You will be confirmed automatically if the doctor's slot becomes free.</p>}
    {loading ? <p className="mt-4 text-sm text-[#82918b]">Loading...</p> : rows.length === 0 ? <p className="mt-4 text-sm text-[#82918b]">No appointments yet. Book your first appointment from the home page.</p> :
      <div className="mt-4 divide-y divide-[#eef1ec]">{rows.map(row => { const b = badge(row); return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><div className="text-sm font-bold text-[#32514b]">{row.providerName} · {row.department}</div><div className="mt-1 text-xs text-[#82918b]">{new Date(row.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {row.appointmentType}</div></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${b.cls}`}>{b.text}</span>{(row.status === "scheduled" || row.status === "waiting") && row.scheduledAt > Date.now() && <><Button size="sm" variant="outline" onClick={() => setEditing(editing === row.id ? null : row.id)} className="h-7 rounded-lg text-[11px] font-bold text-[#0d6e65]">Reschedule</Button><Button size="sm" variant="outline" disabled={cancelling} onClick={() => onCancel(row.id)} className="h-7 rounded-lg text-[11px] font-bold text-[#b0463b]">Cancel</Button></>}</div>{editing === row.id && <RescheduleForm row={row} onDone={() => setEditing(null)} />}</div>; })}</div>}
  </div>;
}

function RescheduleForm({ row, onDone }: { row: any; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const slots = trpc.appointments.slots.useQuery({ providerName: row.providerName, date }, { enabled: Boolean(date) });
  const slotMinutes = slots.data?.slotMinutes ?? 30;
  const bookedTimes = (slots.data?.booked ?? []).map(slot => slot.time);
  const reschedule = trpc.appointments.reschedule.useMutation({
    onSuccess: () => { toast.success("Appointment rescheduled. A confirmation e-mail was sent."); utils.appointments.mine.invalidate(); utils.appointments.slots.invalidate(); onDone(); },
    onError: (error) => toast.error(error.message || "Could not reschedule."),
  });
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  return <form onSubmit={(e) => { e.preventDefault(); reschedule.mutate({ id: row.id, date, time }); }} className="mt-3 w-full rounded-xl border border-[#e1e6df] bg-[#fbfcf9] p-4">
    <p className="text-[11px] font-bold text-[#32514b]">Choose a new free time with {row.providerName}</p>
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label className="text-[11px] font-semibold text-[#657871]">Date<input type="date" required min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="mt-1 block h-9 rounded-lg border border-[#dfe5dc] bg-white px-2 text-xs" /></label>
      <label className="text-[11px] font-semibold text-[#657871]">Time<input type="time" required min={`${String(CLINIC.openHour).padStart(2, "0")}:00`} max={`${String(CLINIC.closeHour).padStart(2, "0")}:00`} step={slotMinutes * 60} value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block h-9 rounded-lg border border-[#dfe5dc] bg-white px-2 text-xs" /></label>
      <Button type="submit" disabled={reschedule.isPending || !date || !time} className="h-9 rounded-lg bg-[#0d6e65] text-xs font-bold text-white hover:bg-[#09584f]">{reschedule.isPending ? "Saving..." : "Confirm new time"}</Button>
      <Button type="button" variant="ghost" onClick={onDone} className="h-9 text-xs">Close</Button>
    </div>
    {bookedTimes.length > 0 && <p className="mt-2 text-[11px] text-[#8a6a3a]">Already booked that day: {bookedTimes.join(", ")}</p>}
    <p className="mt-1 text-[10px] text-[#98a39d]">Clinic hours: {CLINIC.hoursLabel}. Only free times can be chosen; to join a waiting list book from the home page.</p>
  </form>;
}
