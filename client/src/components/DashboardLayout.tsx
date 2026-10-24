import type { ReactNode } from "react";
import { Activity, CalendarDays, ChevronRight, Clock, LayoutDashboard, LogOut, Mail, Package, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DashboardSection = "overview" | "patients" | "appointments" | "waiting" | "pharmacy" | "users" | "contacts" | "careops";

const navItems: Array<{ id: DashboardSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "waiting", label: "Waiting List", icon: Clock },
  { id: "pharmacy", label: "Pharmacy", icon: Package },
  { id: "users", label: "Registered Users", icon: Users },
  { id: "contacts", label: "Contact Messages", icon: Mail },
];

export default function DashboardLayout({
  activeSection,
  onSectionChange,
  onLogout,
  userName,
  userEmail,
  children,
}: {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
  userName: string;
  userEmail?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#163431]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#dfe3d8] bg-[#f8f7f3] px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0d5e57] text-white shadow-[0_8px_20px_rgba(13,94,87,.2)]">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <div className="display-font text-[15px] font-extrabold tracking-[-.03em] text-[#123b38]">Civic Health</div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7a8b85]">Command center</div>
          </div>
        </div>

        <div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#98a59d]">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${active ? "bg-[#e0f0eb] text-[#0b6a62]" : "text-[#71827b] hover:bg-[#eef0e9] hover:text-[#204945]"}`}>
                <Icon className={`h-[17px] w-[17px] ${active ? "text-[#0d8d80]" : "text-[#8e9e96] group-hover:text-[#0d6b63]"}`} strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </button>
            );
          })}
          <button onClick={() => onSectionChange("careops")} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${activeSection === "careops" ? "bg-[#fff0dc] text-[#a45c24]" : "text-[#71827b] hover:bg-[#eef0e9] hover:text-[#204945]"}`}>
            <Sparkles className={`h-[17px] w-[17px] ${activeSection === "careops" ? "text-[#d8893d]" : "text-[#8e9e96] group-hover:text-[#0d6b63]"}`} strokeWidth={2.2} />
            <span>CareOps AI</span>
            <span className="ml-auto rounded-full bg-[#f8d59e] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#855221]">New</span>
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-[#dfe7df] bg-white/70 p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#557169]"><ShieldCheck className="h-4 w-4 text-[#0a8a7c]" /> Administrator only</div>
            <div className="mt-1.5 text-[11px] leading-4 text-[#89968f]">Protected with server-side role checks and audit-ready access.</div>
          </div>
          <div className="flex items-center gap-3 border-t border-[#e3e6df] px-2 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6ece4] text-[12px] font-extrabold text-[#0c6d63]">{userName.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold text-[#2e4c47]">{userName}</div><div className="truncate text-[10px] text-[#94a099]">{userEmail || "Administrator"}</div></div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 text-[#94a099] hover:bg-[#eaf1eb] hover:text-[#a34b3b]" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <div className="border-b border-[#e4e4dc] bg-[#f8f7f3] px-5 py-3 lg:hidden"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d5e57] text-white"><Activity className="h-4 w-4" /></div><span className="display-font text-sm font-extrabold text-[#123b38]">Civic Health</span></div><nav className="mt-3 flex gap-1 overflow-x-auto pb-0.5">{navItems.map((item) => { const Icon = item.icon; const active = activeSection === item.id; return <button key={item.id} onClick={() => onSectionChange(item.id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold ${active ? "bg-[#e0f0eb] text-[#0b6a62]" : "text-[#82928a]"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}<button onClick={() => onSectionChange("careops")} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold ${activeSection === "careops" ? "bg-[#fff0dc] text-[#a45c24]" : "text-[#82928a]"}`}><Sparkles className="h-3.5 w-3.5" />CareOps</button></nav></div>
        {children}
      </div>
    </div>
  );
}
