import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@shared/clinic";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Siren,
  Star,
  UserCheck,
} from "lucide-react";
import { useLocation } from "wouter";

const eyebrow = "text-sm font-bold text-[#0d887b]";
const h2 = "display-font mt-2 text-4xl font-extrabold sm:text-5xl";

// NOTE: doctors / reviews below are sample content - replace with your hospital's real data.
const doctors = [
  { name: "Dr. A. Mehta", specialty: "Cardiology", focus: "Heart health, follow-ups and cardiac reviews", avatar: "bg-[#c24a3d]" },
  { name: "Dr. N. Rao", specialty: "Neurology", focus: "Headache, nerve and brain-related concerns", avatar: "bg-[#6a52c9]" },
  { name: "Dr. S. Iyer", specialty: "Pediatrics", focus: "Child health, growth and vaccinations", avatar: "bg-[#b57514]" },
  { name: "Dr. R. Patel", specialty: "Orthopedics", focus: "Bone, joint and mobility care", avatar: "bg-[#2f69b3]" },
];

const steps = [
  { icon: UserCheck, title: "Create your account", text: "Register once and sign in to your private patient portal." },
  { icon: CalendarCheck, title: "Choose doctor & time", text: "Pick a department, doctor and a free slot. Booked slots are shown clearly." },
  { icon: Bell, title: "Get confirmed", text: "You receive an e-mail. If the slot is full, join the waiting list and we confirm you automatically." },
];

const reviews = [
  { name: "Sample patient", text: "Booking was quick, and I was told my exact waiting-list position. A slot opened and I got the confirmation at once.", dept: "Cardiology" },
  { name: "Sample patient", text: "Clear schedule, no phone calls needed. Reminders and confirmations arrive by e-mail.", dept: "General Medicine" },
  { name: "Sample patient", text: "I could manage my family's appointments from one portal. Simple and calm to use.", dept: "Pediatrics" },
];

const faqs = [
  { q: "How does the waiting list work?", a: "If the time you want is already booked, you can join the waiting list for that doctor and slot. When someone cancels, the first person in the queue is confirmed automatically and receives an e-mail. You can see your position in My appointments." },
  { q: "Can I cancel or change an appointment?", a: "Yes. Open My appointments in your patient portal and cancel. The freed slot is offered to the next waiting patient. Then book a new time from the home page." },
  { q: "What are the clinic working hours?", a: `${CLINIC.hoursLabel}. Online booking is available for 30-minute slots during clinic hours; Sundays are closed except emergencies.` },
  { q: "Is this for emergencies?", a: `No. For a medical emergency call ${CLINIC.emergencyPhone} or come straight to the emergency department - do not wait for an online booking.` },
  { q: "Is my information safe?", a: "Patient and administrator access are separate, and passwords are stored hashed. Only authorised staff can view appointment records." },
];

export default function HomeSections({ onBook }: { onBook: () => void }) {
  const [, navigate] = useLocation();

  return (
    <>
      {/* EMERGENCY STRIP */}
      <section className="bg-[#b0463b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3 text-sm font-bold">
            <Siren className="h-5 w-5" /> Medical emergency? Call {CLINIC.emergencyPhone} - emergency care is open 24×7.
          </div>
          <a href={`tel:${CLINIC.emergencyPhone}`} className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#b0463b]">
            Call now
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <p className={eyebrow}>How it works</p>
        <h2 className={h2}>Book in three simple steps.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-[#e2e6df] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="display-font text-4xl font-extrabold text-[#cfe3d9]">{i + 1}</span>
              </div>
              <h3 className="display-font mt-5 text-lg font-extrabold">{step.title}</h3>
              <p className="mt-2 text-xs leading-6 text-[#82918b]">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DOCTORS */}
      <section className="bg-[#edf3ee] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className={eyebrow}>Our doctors</p>
          <h2 className={h2}>Meet the specialists.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doc) => (
              <div key={doc.name} className="rounded-2xl border border-[#dce7df] bg-white p-6 shadow-sm">
                <div className={`display-font flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white ${doc.avatar}`}>
                  {doc.name.replace("Dr. ", "").split(" ").map((p) => p[0]).join("")}
                </div>
                <h3 className="display-font mt-5 text-lg font-extrabold">{doc.name}</h3>
                <p className="text-xs font-bold text-[#0d887b]">{doc.specialty}</p>
                <p className="mt-2 text-xs leading-6 text-[#82918b]">{doc.focus}</p>
                <Button onClick={onBook} variant="outline" className="mt-4 w-full rounded-xl text-xs font-bold">
                  Book with {doc.name.split(" ").slice(-1)[0]}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CAREVISTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <p className={eyebrow}>Why CareVista</p>
        <h2 className={h2}>Care that respects your time.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            { icon: ClipboardList, t: "Live slot view", d: "See booked times before you choose." },
            { icon: Activity, t: "Smart waiting list", d: "Auto-confirmed when a slot frees up." },
            { icon: Mail, t: "E-mail updates", d: "Confirmation and waiting-list messages." },
            { icon: ShieldCheck, t: "Private & secure", d: "Separate patient and admin access." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-[#e2e6df] bg-white p-5">
              <f.icon className="h-5 w-5 text-[#0d796f]" />
              <h3 className="display-font mt-4 text-base font-extrabold">{f.t}</h3>
              <p className="mt-1 text-xs leading-6 text-[#82918b]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#edf3ee] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className={eyebrow}>Patient stories</p>
          <h2 className={h2}>What patients say.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reviews.map((r, i) => (
              <figure key={i} className="rounded-2xl border border-[#dce7df] bg-white p-6 shadow-sm">
                <Quote className="h-5 w-5 text-[#9bd8cb]" />
                <div className="mt-3 flex gap-0.5 text-[#e2994c]">
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <blockquote className="mt-3 text-sm leading-6 text-[#426057]">{r.text}</blockquote>
                <figcaption className="mt-4 text-[11px] font-bold text-[#82918b]">{r.name} · {r.dept}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <p className={eyebrow}>FAQ</p>
        <h2 className={h2}>Common questions.</h2>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-bold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-[#6b7d76]">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* VISIT US */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={Clock} title="Working hours" lines={["Mon–Sat: 9:00 AM – 5:00 PM", "Sunday: closed (emergency only)", "Emergency: 24×7"]} />
          <InfoCard icon={MapPin} title="Find us" lines={[CLINIC.address]} />
          <InfoCard icon={Phone} title="Contact" lines={[CLINIC.phone, CLINIC.email]} />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e2e6df]">
          <iframe
            title="CareVista Hospital location"
            loading="lazy"
            className="h-64 w-full"
            src={`https://www.google.com/maps?q=${encodeURIComponent(CLINIC.address)}&output=embed`}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onBook} className="rounded-xl bg-[#0d6e65] font-bold text-white hover:bg-[#09584f]">
            Book appointment <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/contact")} variant="outline" className="rounded-xl font-bold">Contact us</Button>
        </div>
      </section>
    </>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: typeof Clock; title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-[#e2e6df] bg-white p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]"><Icon className="h-5 w-5" /></div>
      <h3 className="display-font mt-4 text-lg font-extrabold">{title}</h3>
      {lines.map((l) => <p key={l} className="mt-1 text-xs leading-6 text-[#6b7d76]">{l}</p>)}
    </div>
  );
}
