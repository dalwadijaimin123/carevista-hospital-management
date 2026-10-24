import { trpc } from "@/lib/trpc";
import { CLINIC } from "@shared/clinic";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";

export const BOARD_DOCTORS = [
  { name: "Dr. A. Mehta", dept: "Cardiology" },
  { name: "Dr. N. Rao", dept: "Neurology" },
  { name: "Dr. S. Iyer", dept: "Pediatrics" },
  { name: "Dr. R. Patel", dept: "Orthopedics" },
] as const;

export type BoardDoctor = (typeof BOARD_DOCTORS)[number];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const label12 = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

/** First day that is open and still has at least one bookable slot left. */
function nextBookableDay(slotMinutes: number) {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if ((CLINIC.closedWeekdays as readonly number[]).includes(d.getDay())) continue;
    if (i === 0) {
      const lastStart = CLINIC.closeHour * 60 - slotMinutes;
      if (now.getHours() * 60 + now.getMinutes() >= lastStart) continue;
    }
    return d;
  }
  return new Date();
}

/**
 * Live availability for one doctor on the next open day. Clicking a free slot books it,
 * clicking a taken slot joins its waiting list - both just fill the booking form.
 */
export default function SlotBoard({
  onPick,
}: {
  onPick: (doctor: BoardDoctor, date: string, time: string) => void;
}) {
  const [doctor, setDoctor] = useState<BoardDoctor>(BOARD_DOCTORS[0]);
  const day = useMemo(() => nextBookableDay(30), []);
  const date = toDateKey(day);
  const isToday = date === toDateKey(new Date());

  const query = trpc.appointments.slots.useQuery(
    { providerName: doctor.name, date },
    { refetchInterval: 30000 },
  );
  const slotMinutes = query.data?.slotMinutes ?? 30;
  const taken = new Map((query.data?.booked ?? []).map((s) => [s.time, s.waiting]));

  const slots: { time: string; minutes: number }[] = [];
  for (let m = CLINIC.openHour * 60; m + slotMinutes <= CLINIC.closeHour * 60; m += slotMinutes) {
    slots.push({ time: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, minutes: m });
  }

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const freeCount = slots.filter((s) => !taken.has(s.time) && !(isToday && s.minutes <= nowMinutes)).length;

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-2.5 shadow-[0_30px_100px_rgba(0,0,0,.28)] backdrop-blur">
      <div className="rounded-[21px] bg-white p-5 text-[#173d38] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="display-font text-xl font-extrabold">
              {isToday ? "Today" : day.toLocaleDateString([], { weekday: "long" })}'s open slots
            </h2>
            <p className="mt-1 text-xs text-[#6b7d76]">
              {day.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })} ·{" "}
              {query.isLoading ? "checking..." : `${freeCount} free`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e2f1eb] text-[#0d796f]">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>

        <div role="tablist" aria-label="Choose a doctor" className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
          {BOARD_DOCTORS.map((d) => {
            const active = d.name === doctor.name;
            return (
              <button
                key={d.name}
                role="tab"
                aria-selected={active}
                onClick={() => setDoctor(d)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-[#0d5e57] bg-[#0d5e57] text-white"
                    : "border-[#dfe7e1] bg-white text-[#426057] hover:border-[#9bd8cb]"
                }`}
              >
                <div className="text-xs font-bold">{d.name}</div>
                <div className={`text-[10px] ${active ? "text-[#b9e3da]" : "text-[#8a9992]"}`}>{d.dept}</div>
              </button>
            );
          })}
        </div>

        <div key={`${doctor.name}-${date}`} className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot, i) => {
            const waiting = taken.get(slot.time);
            const isTaken = waiting !== undefined;
            const past = isToday && slot.minutes <= nowMinutes;
            const style = { animationDelay: `${i * 22}ms` };

            if (past) {
              return (
                <span key={slot.time} style={style} className="slot-chip rounded-xl bg-[#f2f4f1] px-2 py-2.5 text-center text-xs font-semibold text-[#b8c2bc] line-through">
                  {label12(slot.minutes)}
                </span>
              );
            }
            return (
              <button
                key={slot.time}
                style={style}
                onClick={() => onPick(doctor, date, slot.time)}
                title={isTaken ? "Booked - click to join the waiting list" : "Free - click to book"}
                className={`slot-chip rounded-xl border px-2 py-2 text-center text-xs font-bold transition-colors ${
                  isTaken
                    ? "border-[#f1d9b0] bg-[#fff6e6] text-[#9a6a1f] hover:bg-[#ffecc9]"
                    : "border-[#bfe3d9] bg-[#effaf6] text-[#0b6b61] hover:border-[#0d887b] hover:bg-[#d9f2e9]"
                }`}
              >
                {label12(slot.minutes)}
                <span className="block text-[9px] font-semibold opacity-80">
                  {isTaken ? ((waiting ?? 0) > 0 ? `Waitlist · ${waiting}` : "Waitlist") : "Free"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6b7d76]">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#bfe3d9]" /> Free: books instantly</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f1d9b0]" /> Booked: join the waiting list</span>
        </div>
      </div>
    </div>
  );
}
