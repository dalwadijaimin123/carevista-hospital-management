
import { FormEvent, useState } from "react";
import PublicHeader from "@/components/PublicHeader";
import HomeSections from "@/components/HomeSections";
import SlotBoard, { type BoardDoctor } from "@/components/SlotBoard";
import { CLINIC } from "@shared/clinic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import {
  ArrowRight,
  Baby,
  Bone,
  Brain,
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, navigate] = useLocation();

  const {
    data: currentUser,
    isLoading: isAuthLoading,
  } = trpc.auth.me.useQuery();

  // Appointment form state
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  const [department, setDepartment] = useState<"Cardiology" | "Neurology" | "Pediatrics" | "Orthopedics" | "General Medicine" | "Pharmacy">("Cardiology");
  const [providerName, setProviderName] = useState<"Dr. A. Mehta" | "Dr. N. Rao" | "Dr. S. Iyer" | "Dr. R. Patel">("Dr. A. Mehta");
  const [appointmentType, setAppointmentType] = useState<"Consultation" | "Follow-up consultation" | "General check-up" | "Specialist consultation">("Consultation");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [bookingError, setBookingError] = useState("");
  const [booked, setBooked] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  const utils = trpc.useUtils();

  // Booked times of the selected doctor on the selected date
  const slotsQuery = trpc.appointments.slots.useQuery(
    { providerName, date },
    { enabled: Boolean(date && providerName) },
  );
  const slotMinutes = slotsQuery.data?.slotMinutes ?? 30;
  const bookedSlots = slotsQuery.data?.booked ?? [];
  const chosenSlot = (() => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    const start = Math.floor((h * 60 + m) / slotMinutes) * slotMinutes;
    const label = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
    return bookedSlots.find((slot) => slot.time === label) ?? null;
  })();

  // Create appointment
  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: (data) => {
      setBooked(true);
      setWaitlisted(Boolean(data.waitlisted));
      setQueuePosition(data.queuePosition ?? 0);
      setBookingError("");
      utils.appointments.slots.invalidate();
      utils.appointments.mine.invalidate();

      // Waiting list: keep the patient's details so only the time has to be changed.
      if (data.waitlisted) {
        setTime("");
        return;
      }

      setPatientName("");
      setPatientEmail("");
      setPatientPhone("");
      setDepartment("Cardiology");
      setProviderName("Dr. A. Mehta");
      setAppointmentType("Consultation");
      setDate("");
      setTime("");
      setNotes("");
    },

    onError: (error) => {
      setBooked(false);
      setBookingError(
        error.message || "Unable to book the appointment. Please try again.",
      );
    },
  });

  // Submit appointment
  const submitAppointment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setBookingError("");
    setBooked(false);

    if (isAuthLoading) {
      return;
    }

    if (!currentUser) {
      navigate("/login");
      return;
    }

    createAppointment.mutate({
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      department,
      providerName,
      appointmentType,
      date,
      time,
      notes: notes.trim() || undefined,
    });
  };

  // Today's date
  const today = new Date().toISOString().split("T")[0];

  // Scroll to appointment form
  const goToAppointment = () => {
    if (isAuthLoading) return;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    document.getElementById("appointment-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Clicking a slot in the live board fills the form and jumps to it.
  const pickSlot = (doctor: BoardDoctor, pickedDate: string, pickedTime: string) => {
    setProviderName(doctor.name);
    setDepartment(doctor.dept);
    setDate(pickedDate);
    setTime(pickedTime);
    setBooked(false);
    setBookingError("");
    document.getElementById("appointment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const nowDate = new Date();
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const clinicOpen =
    !(CLINIC.closedWeekdays as readonly number[]).includes(nowDate.getDay()) &&
    nowMinutes >= CLINIC.openHour * 60 &&
    nowMinutes < CLINIC.closeHour * 60;

  return (
    <div className="min-h-screen bg-[#f5f9f7] text-[#173d38]">
      <PublicHeader />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-[#103a35] text-white">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#168b7c] opacity-25 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#e8a35d] opacity-20 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            {/* HERO CONTENT */}
            <div>
              <div className={`inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold ${clinicOpen ? "text-[#9bd8cb]" : "text-[#e9b878]"}`}>
                <span className={`live-dot h-2 w-2 rounded-full ${clinicOpen ? "bg-[#4fd1b5] text-[#4fd1b5]" : "bg-[#e9b878] text-[#e9b878]"}`} />
                {clinicOpen
                  ? `Clinic is open until ${CLINIC.closeHour - 12}:00 PM today`
                  : "Clinic is closed right now. Book the next open day."}
              </div>

              <h1 className="display-font mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
                Pick a doctor, pick a time, skip the queue.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#bad0cb]">
                See which half-hour slots are free. If the one you want is taken,
                join the waiting list and we confirm you by e-mail the moment it opens.
              </p>

              {/* HERO BUTTONS */}
<div className="mt-6 flex flex-wrap items-center gap-5">
  <Button
    onClick={goToAppointment}
    disabled={isAuthLoading}
    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e7b16f] px-5 text-sm font-extrabold text-[#183b36] hover:bg-[#f0c38b]"
  >
    <span>Book an Appointment</span>
    <ArrowRight className="h-4 w-4 shrink-0" />
  </Button>

  {!currentUser && <Button
    onClick={() => navigate("/register")}
    variant="outline"
    className="inline-flex h-12 items-center justify-center rounded-xl border-white/20 bg-white/5 px-5 text-sm font-bold text-white hover:bg-white/10"
  >
    New user? Register
  </Button>}

  <Button
    onClick={() => navigate("/ai-assistant")}
    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#79cabb]/40 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20"
  >
    <Sparkles className="h-4 w-4 shrink-0 text-[#9bd8cb]" />
    <span>AI Health Assistant</span>
    <ArrowRight className="h-4 w-4 shrink-0" />
  </Button>
</div>

              {/* HERO FEATURES */}
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[11px] text-[#9fbab4]">
                <span className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-[#79cabb]" />
                  30-minute slots, no double booking
                </span>

                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#79cabb]" />
                  Waiting list that confirms for you
                </span>

                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#79cabb]" />
                  Reminder e-mail the day before
                </span>
              </div>
            </div>

            {/* LIVE SLOT BOARD */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <SlotBoard onPick={pickSlot} />
            </div>
          </div>

          {/* ECG line: hospital motif, draws once */}
          <svg aria-hidden viewBox="0 0 1200 80" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full">
            <path className="ecg-line" fill="none" stroke="#4fd1b5" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d="M0 48 H300 L330 48 L350 20 L378 70 L400 8 L424 60 L444 48 H760 L784 48 L800 28 L822 62 L840 48 H1200" />
          </svg>
        </section>

        {/* APPOINTMENT FORM */}
        <section
          id="appointment-form"
          className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8"
        >
          <div className="overflow-hidden rounded-[30px] border border-[#dfe8e1] bg-white shadow-[0_20px_60px_rgba(28,62,54,.08)]">
            <div className="grid lg:grid-cols-[.72fr_1.28fr]">
              {/* LEFT INFORMATION */}
              <div className="bg-[#103a35] p-7 text-white sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#e8b878]">
                  <CalendarDays className="h-6 w-6" />
                </div>

                <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#8bd4c7]">
                  Appointment booking
                </p>

                <h2 className="display-font mt-3 text-4xl font-extrabold tracking-[-.055em]">
                  Book your visit with CareVista.
                </h2>

                <p className="mt-5 text-sm leading-7 text-[#b7ceca]">
                  Choose a department, specialist and convenient time. Your
                  appointment will be securely saved in the hospital database.
                </p>

                <div className="mt-8 space-y-4 text-xs text-[#c4d7d2]">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#79cabb]" />
                    Appointment stored in hospital records
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#79cabb]" />
                    Admin team can view the booking
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#79cabb]" />
                    Choose your preferred date and time
                  </div>
                </div>
              </div>

              {/* RIGHT FORM */}
              <div className="p-7 sm:p-10">
                {isAuthLoading ? (
                  /* CHECKING LOGIN */
                  <div className="flex min-h-[300px] items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>Checking login status...</p>
                  </div>
                ) : !currentUser ? (
                  /* LOGIN REQUIRED */
                  <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f2eb] text-[#0d796f]">
                      <ShieldCheck className="h-8 w-8" />
                    </div>

                    <h3 className="display-font mt-6 text-3xl font-extrabold">
                      Login Required
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-6 text-[#7b8c85]">
                      Please log in to your CareVista account before booking an
                      appointment.
                    </p>

                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <Button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="h-11 rounded-xl bg-[#0e6c63] px-6 font-bold"
                      >
                        Login to Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/register")}
                        className="h-11 rounded-xl px-6 font-bold"
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                ) : booked ? (
                  /* BOOKING SUCCESS */
                  <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f2eb] text-[#0d796f]">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>

                    <h3 className="display-font mt-6 text-3xl font-extrabold">
                      {waitlisted ? "Added to Waiting List" : "Appointment Booked!"}
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-6 text-[#7b8c85]">
                      {waitlisted
                        ? `This doctor is already booked for that time. You are number ${queuePosition} on the waiting list and will be confirmed automatically if the slot becomes free. You can also choose another time or doctor.`
                        : "Your appointment request has been submitted successfully."}
                    </p>

                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <Button
                        type="button"
                        onClick={() => setBooked(false)}
                        className="h-11 rounded-xl bg-[#0e6c63] px-6 font-bold"
                      >
                        {waitlisted ? "Choose Another Time" : "Book Another Appointment"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/user")}
                        className="h-11 rounded-xl px-6 font-bold"
                      >
                        {waitlisted ? "View My Waiting List" : "View My Appointments"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* APPOINTMENT FORM */
                  <>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0d887b]">
                          Patient details
                        </p>

                        <h3 className="display-font mt-2 text-2xl font-extrabold">
                          Appointment form
                        </h3>
                      </div>

                      <span className="hidden rounded-full bg-[#edf5f1] px-3 py-1.5 text-[9px] font-extrabold text-[#0d796f] sm:block">
                        Secure booking
                      </span>
                    </div>

                    <form
                      onSubmit={submitAppointment}
                      className="mt-7 grid gap-4 sm:grid-cols-2"
                    >
                      {/* NAME */}
                      <div>
                        <Label
                          htmlFor="patientName"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Full name
                        </Label>

                        <Input
                          id="patientName"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Enter patient name"
                          className="mt-2 h-11 rounded-xl"
                          required
                        />
                      </div>

                      {/* EMAIL */}
                      <div>
                        <Label
                          htmlFor="patientEmail"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Email
                        </Label>

                        <Input
                          id="patientEmail"
                          type="email"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="patient@email.com"
                          className="mt-2 h-11 rounded-xl"
                          required
                        />
                      </div>

                      {/* PHONE */}
                      <div>
                        <Label
                          htmlFor="patientPhone"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Phone number
                        </Label>

                        <Input
                          id="patientPhone"
                          type="tel"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="10 digit mobile number"
                          className="mt-2 h-11 rounded-xl"
                          required
                        />
                      </div>

                      {/* DEPARTMENT */}
                      <div>
                        <Label
                          htmlFor="department"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Department
                        </Label>

                        <select
                          id="department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value as typeof department)}
                          className="mt-2 h-11 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-sm outline-none focus:border-[#8fcfc2]"
                        >
                          <option>Cardiology</option>
                          <option>Neurology</option>
                          <option>Pediatrics</option>
                          <option>Orthopedics</option>
                          <option>General Medicine</option>
                          <option>Pharmacy</option>
                        </select>
                      </div>

                      {/* DOCTOR */}
                      <div>
                        <Label
                          htmlFor="providerName"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Preferred doctor
                        </Label>

                        <select
                          id="providerName"
                          value={providerName}
                          onChange={(e) => setProviderName(e.target.value as typeof providerName)}
                          className="mt-2 h-11 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-sm outline-none focus:border-[#8fcfc2]"
                        >
                          <option>Dr. A. Mehta</option>
                          <option>Dr. N. Rao</option>
                          <option>Dr. S. Iyer</option>
                          <option>Dr. R. Patel</option>
                        </select>
                      </div>

                      {/* APPOINTMENT TYPE */}
                      <div>
                        <Label
                          htmlFor="appointmentType"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Appointment type
                        </Label>

                        <select
                          id="appointmentType"
                          value={appointmentType}
                          onChange={(e) => setAppointmentType(e.target.value as typeof appointmentType)}
                          className="mt-2 h-11 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-sm outline-none focus:border-[#8fcfc2]"
                        >
                          <option>Consultation</option>
                          <option>Follow-up consultation</option>
                          <option>General check-up</option>
                          <option>Specialist consultation</option>
                        </select>
                      </div>

                      {/* DATE */}
                      <div>
                        <Label
                          htmlFor="date"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Preferred date
                        </Label>

                        <Input
                          id="date"
                          type="date"
                          value={date}
                          min={today}
                          onChange={(e) => setDate(e.target.value)}
                          className="mt-2 h-11 rounded-xl"
                          required
                        />
                      </div>

                      {/* TIME */}
                      <div>
                        <Label
                          htmlFor="time"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Preferred time
                        </Label>

                        <Input
                          id="time"
                          type="time"
                          min={`${String(CLINIC.openHour).padStart(2, "0")}:00`}
                          max={`${String(CLINIC.closeHour).padStart(2, "0")}:00`}
                          step={slotMinutes * 60}
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="mt-2 h-11 rounded-xl"
                          required
                        />

                        <div className="mt-2 text-[11px] leading-5 text-[#82918b]">
                          Clinic hours: {CLINIC.hoursLabel}
                        </div>

                        {bookedSlots.length > 0 && (
                          <div className="mt-2 text-[11px] leading-5 text-[#8a6a3a]">
                            Already booked for {providerName}:{" "}
                            {bookedSlots.map((slot) => slot.time).join(", ")}
                          </div>
                        )}

                        {chosenSlot && (
                          <div className="mt-2 rounded-lg border border-[#f1d9b0] bg-[#fff6e6] px-3 py-2 text-[11px] font-semibold leading-5 text-[#9a6a1f]">
                            This slot is already booked. You can pick another time, or submit
                            to join the waiting list
                            {chosenSlot.waiting > 0 ? ` (${chosenSlot.waiting} already waiting)` : ""}.
                          </div>
                        )}
                      </div>

                      {/* NOTES */}
                      <div className="sm:col-span-2">
                        <Label
                          htmlFor="notes"
                          className="text-xs font-bold text-[#48645c]"
                        >
                          Additional notes{" "}
                          <span className="font-normal text-[#9aa59f]">
                            (optional)
                          </span>
                        </Label>

                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Tell us anything the hospital team should know..."
                          className="mt-2 min-h-24 rounded-xl"
                        />
                      </div>

                      {/* ERROR MESSAGE */}
                      {bookingError && (
                        <div
                          role="alert"
                          className="sm:col-span-2 rounded-xl border border-[#f0c9c1] bg-[#fff0ec] px-3 py-2.5 text-xs font-semibold leading-5 text-[#a44839]"
                        >
                          {bookingError}
                        </div>
                      )}

                      {/* SUBMIT */}
                      <Button
                        type="submit"
                        disabled={createAppointment.isPending}
                        className="h-12 rounded-xl bg-[#0e6c63] font-extrabold text-white shadow-[0_12px_24px_rgba(14,108,99,.18)] hover:bg-[#09584f] sm:col-span-2"
                      >
                        {createAppointment.isPending ? (
                          <>
                            <span>Booking appointment...</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <span>Confirm Appointment</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#0d887b]">
                Our services
              </p>

              <h2 className="display-font mt-3 text-4xl font-extrabold tracking-[-.055em]">
                Everything for a smoother hospital experience.
              </h2>
            </div>

            <Button
              onClick={() => navigate("/services")}
              variant="outline"
              className="rounded-xl"
            >
              View all services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Service
              icon={CalendarDays}
              title="Appointments"
              text="Book, view, and manage appointments with hospital specialists."
            />

            <Service
              icon={Stethoscope}
              title="Specialist care"
              text="Explore departments and connect with the right healthcare team."
            />

            <Service
              icon={ShieldCheck}
              title="Secure access"
              text="Separate patient and administrator access protects hospital tools."
            />
          </div>
        </section>

        {/* DEPARTMENTS */}
        <section className="bg-[#edf3ee] py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#0d887b]">
                  Departments
                </p>

                <h2 className="display-font mt-3 text-4xl font-extrabold tracking-[-.055em]">
                  Care across every stage.
                </h2>
              </div>

              <Button
                onClick={() => navigate("/departments")}
                variant="outline"
                className="rounded-xl bg-white"
              >
                Explore departments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { name: "Cardiology", icon: HeartPulse, tint: "bg-[#fde8e6] text-[#c24a3d]", note: "Heart and circulation" },
                { name: "Neurology", icon: Brain, tint: "bg-[#ece8fb] text-[#6a52c9]", note: "Brain and nerves" },
                { name: "Pediatrics", icon: Baby, tint: "bg-[#fff1d6] text-[#b57514]", note: "Children's health" },
                { name: "Orthopedics", icon: Bone, tint: "bg-[#e3eefb] text-[#2f69b3]", note: "Bones and joints" },
                { name: "General Medicine", icon: Stethoscope, tint: "bg-[#dff3ea] text-[#0d796f]", note: "First point of care" },
                { name: "Pharmacy", icon: Pill, tint: "bg-[#e6f4d9] text-[#4c8a1f]", note: "Medicines and stock" },
              ].map(({ name, icon: Icon, tint, note }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate("/departments")}
                  className="group flex items-center gap-4 rounded-2xl border border-[#dce7df] bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="display-font block text-base font-extrabold text-[#173d38]">{name}</span>
                    <span className="mt-0.5 block text-xs text-[#82918b]">{note}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <HomeSections onBook={goToAppointment} />

        {/* ABOUT / CTA */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="rounded-[30px] bg-[#103a35] px-7 py-10 text-white sm:px-12 sm:py-14">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#8bd4c7]">
              About CareVista Hospital
            </p>

            <h2 className="display-font mt-4 text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">
              One public website. Clear access for every role.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b7ceca]">
              Patients register and sign in to use their account. Administrators
              have a separate login and a protected command center.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/about")}
                className="rounded-xl bg-[#e7b16f] font-extrabold text-[#183b36] hover:bg-[#f0c38b]"
              >
                About Us
              </Button>

              <Button
                onClick={() => navigate("/contact")}
                variant="outline"
                className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e2e5dd] bg-[#103a35] px-5 py-12 text-[#b7ceca] sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 text-xs leading-6 md:grid-cols-4">
          <div>
            <div className="display-font text-lg font-extrabold text-white">CareVista Hospital</div>
            <p className="mt-2">Appointments, waiting list and patient portal in one place.</p>
          </div>
          <div>
            <div className="font-bold text-white">Explore</div>
            <button onClick={() => navigate("/services")} className="block hover:text-white">Services</button>
            <button onClick={() => navigate("/departments")} className="block hover:text-white">Departments</button>
            <button onClick={() => navigate("/about")} className="block hover:text-white">About us</button>
            <button onClick={() => navigate("/ai-assistant")} className="block hover:text-white">AI health assistant</button>
          </div>
          <div>
            <div className="font-bold text-white">Patients</div>
            <button onClick={() => navigate("/login")} className="block hover:text-white">Patient login</button>
            <button onClick={() => navigate("/register")} className="block hover:text-white">Register</button>
            <button onClick={() => navigate("/user")} className="block hover:text-white">My appointments</button>
            <button onClick={() => navigate("/admin-login")} className="block hover:text-white">Staff / Admin</button>
          </div>
          <div>
            <div className="font-bold text-white">Contact</div>
            <p>{CLINIC.address}</p>
            <p>{CLINIC.phone}</p>
            <p>{CLINIC.email}</p>
            <p>{CLINIC.hoursLabel}</p>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-[10px] text-[#7fa39b]">
          © 2026 CareVista Hospital · This website does not replace emergency care - call {CLINIC.emergencyPhone} in an emergency.
        </div>
      </footer>
    </div>
  );
}

/* SERVICE CARD */
function Service({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e3e7df] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f1eb] text-[#0d796f]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="display-font mt-5 text-lg font-extrabold">{title}</h3>

      <p className="mt-2 text-xs leading-6 text-[#83918b]">{text}</p>
    </div>
  );
}
