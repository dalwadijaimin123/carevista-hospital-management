import PublicHeader from "@/components/PublicHeader";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { services } from "@/data/hospitalContent";

export default function Services() {
  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#173d38]">
      <PublicHeader />
      <main>
        <section className="bg-[#103a35] px-5 py-20 text-white sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#8bd4c7]">Hospital services</p>
            <h1 className="display-font mt-4 max-w-4xl text-4xl font-extrabold tracking-[-.06em] sm:text-6xl">Support for every step of the patient journey.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b7ceca]">Explore the tools and information CareVista brings together for patients and hospital teams. Select any service to read what it covers, who it helps and what to prepare.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[#d4e5de]">
              <span className="rounded-full border border-white/20 px-4 py-2">Patient-focused information</span>
              <span className="rounded-full border border-white/20 px-4 py-2">Organised workflows</span>
              <span className="rounded-full border border-white/20 px-4 py-2">Role-based access</span>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0d887b]">Explore services</p><h2 className="display-font mt-2 text-3xl font-extrabold tracking-[-.04em]">What can we help you with?</h2></div>
            <p className="max-w-xl text-sm leading-6 text-[#7c8c85]">Each service has its own detailed guide. Availability and clinical decisions should always be confirmed with the hospital team.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return <Link key={service.slug} href={`/services/${service.slug}`} className="group flex h-full flex-col rounded-2xl border border-[#e3e7df] bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#b9d8cb] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d887b]">
                <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]"><Icon className="h-5 w-5" /></div><ArrowRight className="mt-2 h-4 w-4 text-[#9ca9a2] transition group-hover:translate-x-1 group-hover:text-[#0d796f]" /></div>
                <h3 className="display-font mt-5 text-xl font-extrabold">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#788981]">{service.short}</p>
                <div className="mt-6 flex items-center gap-2 border-t border-[#eef0eb] pt-4 text-xs font-extrabold text-[#0d796f]"><CheckCircle2 className="h-4 w-4" /> View full service details</div>
              </Link>;
            })}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="flex flex-col gap-5 rounded-[28px] bg-[#edf3ee] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0d887b]">Need a starting point?</p><h2 className="display-font mt-2 text-2xl font-extrabold">Browse departments and areas of care.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#71827b]">Department pages explain common areas of focus and how to prepare for a visit.</p></div><Link href="/departments" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0e6c63] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09584f]">Explore departments <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
    </div>
  );
}
