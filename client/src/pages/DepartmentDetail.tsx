import PublicHeader from "@/components/PublicHeader";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, ClipboardList } from "lucide-react";
import { Link, useRoute } from "wouter";
import { departments } from "@/data/hospitalContent";

export default function DepartmentDetail() {
  const [, params] = useRoute<{ slug: string }>("/departments/:slug");
  const department = departments.find((item) => item.slug === params?.slug);

  if (!department) return <div className="min-h-screen bg-[#f8f7f2] text-[#173d38]"><PublicHeader /><main className="mx-auto max-w-3xl px-5 py-24 text-center"><h1 className="display-font text-3xl font-extrabold">Department not found</h1><p className="mt-3 text-sm text-[#71827b]">That department may have moved or the address may be incorrect.</p><Link href="/departments" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0e6c63] px-5 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4" /> All departments</Link></main></div>;
  const Icon = department.icon;

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#173d38]">
      <PublicHeader />
      <main>
        <section className="bg-[#edf3ee] px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-7xl"><Link href="/departments" className="inline-flex items-center gap-2 text-xs font-bold text-[#668077] transition hover:text-[#0d796f]"><ArrowLeft className="h-4 w-4" /> Back to all departments</Link><div className="mt-8 flex max-w-4xl items-start gap-5"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0e6c63] text-white"><Icon className="h-6 w-6" /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#0d887b]">Department overview</p><h1 className="display-font mt-3 text-4xl font-extrabold tracking-[-.06em] sm:text-6xl">{department.title}</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-[#71827b]">{department.short}</p></div></div></div></section>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)] lg:py-16">
          <div className="space-y-8">
            <section className="rounded-2xl border border-[#e3e7df] bg-white p-7 sm:p-9"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0d887b]">About this department</p><h2 className="display-font mt-3 text-2xl font-extrabold">What to expect</h2><p className="mt-4 text-sm leading-7 text-[#71827b]">{department.overview}</p></section>
            <section className="rounded-2xl border border-[#e3e7df] bg-white p-7 sm:p-9"><h2 className="display-font text-2xl font-extrabold">Areas of focus</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{department.highlights.map((item) => <div key={item} className="flex gap-3 rounded-xl bg-[#f5f8f4] p-4"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0d887b]" /><p className="text-sm leading-6 text-[#5f766d]">{item}</p></div>)}</div></section>
            <section className="rounded-2xl border border-[#e3e7df] bg-white p-7 sm:p-9"><div className="flex items-center gap-3"><ClipboardList className="h-5 w-5 text-[#0d887b]" /><h2 className="display-font text-2xl font-extrabold">Preparing for your visit</h2></div><ol className="mt-6 space-y-4">{department.process.map((item, index) => <li key={item} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2f1eb] text-xs font-extrabold text-[#0d796f]">{index + 1}</span><p className="pt-1 text-sm leading-6 text-[#71827b]">{item}</p></li>)}</ol></section>
          </div>
          <aside className="space-y-5"><div className="rounded-2xl border border-[#dbe7dd] bg-[#edf3ee] p-7"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0d887b]">Who may visit</p><h2 className="display-font mt-3 text-xl font-extrabold">This department may be relevant for</h2><ul className="mt-5 space-y-3">{department.idealFor.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#61766d]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d887b]" />{item}</li>)}</ul></div><div className="rounded-2xl border border-[#f0dfc8] bg-[#fffaf2] p-6"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-[#b17936]" /><div><h2 className="text-sm font-extrabold text-[#79572f]">When to seek urgent care</h2><p className="mt-2 text-xs leading-6 text-[#826f57]">{department.note}</p></div></div></div><div className="rounded-2xl bg-[#103a35] p-7 text-white"><h2 className="display-font text-xl font-extrabold">Plan your next step</h2><p className="mt-3 text-sm leading-6 text-[#b7ceca]">Check the appointment information or contact the hospital team to confirm availability.</p><div className="mt-5 space-y-3"><Link href="/contact" className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#153a36]">Contact the hospital <ArrowRight className="h-4 w-4" /></Link><Link href="/services/appointments" className="flex items-center justify-between rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white">Appointment information <ArrowRight className="h-4 w-4" /></Link></div></div></aside>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8"><div className="border-t border-[#e4e8e0] pt-7"><p className="max-w-4xl text-xs leading-6 text-[#82918b]">This page is for general information and visit preparation, not diagnosis or treatment advice. Department availability, assessments and treatment plans must be confirmed with a qualified healthcare professional.</p></div></section>
      </main>
    </div>
  );
}
