import PublicHeader from "@/components/PublicHeader";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Link } from "wouter";
import { departments } from "@/data/hospitalContent";

export default function Departments() {
  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#173d38]">
      <PublicHeader />
      <main>
        <section className="bg-[#edf3ee] px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#0d887b]">Departments</p><h1 className="display-font mt-4 max-w-4xl text-4xl font-extrabold tracking-[-.06em] sm:text-6xl">Find the right place to begin.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-[#71827b]">Explore the departments listed in CareVista. Every department page explains common areas of care, what to bring to an appointment and when urgent help may be needed.</p><div className="mt-7 flex items-center gap-3 text-xs font-bold text-[#476d61]"><Stethoscope className="h-4 w-4 text-[#0d887b]" /> Informational guides to help you prepare for a conversation with the care team</div></div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const Icon = department.icon;
              return <Link key={department.slug} href={`/departments/${department.slug}`} className="group flex h-full flex-col rounded-2xl border border-[#e0e6df] bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#b9d8cb] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d887b]">
                <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f1eb] text-[#0d796f]"><Icon className="h-5 w-5" /></div><ArrowRight className="h-4 w-4 text-[#a1ada7] transition group-hover:translate-x-1 group-hover:text-[#0d796f]" /></div>
                <h2 className="display-font mt-5 text-xl font-extrabold">{department.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#788981]">{department.short}</p>
                <div className="mt-6 border-t border-[#eef0eb] pt-4 text-xs font-extrabold text-[#0d796f]">Department overview and visit guide <span aria-hidden="true">→</span></div>
              </Link>;
            })}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8"><p className="max-w-4xl text-xs leading-6 text-[#88958f]">These pages provide general educational information. They do not diagnose conditions or guarantee that a particular service is available at a specific time. Please contact the hospital to confirm availability and seek urgent care for emergency symptoms.</p></section>
      </main>
    </div>
  );
}
