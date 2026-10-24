/** Clinic working hours (local server time). Used by both the booking form and the server. */
export const CLINIC = {
  name: "CareVista Hospital",
  openHour: 9,
  closeHour: 17, // last slot must END by 17:00
  closedWeekdays: [0], // 0 = Sunday
  phone: "+91 79 4000 1234",
  emergencyPhone: "108",
  email: "care@carevista.example",
  address: "CareVista Hospital, SG Highway, Ahmedabad, Gujarat 380054",
  hoursLabel: "Mon–Sat 9:00 AM – 5:00 PM · Emergency 24×7",
} as const;

/** Returns an error message, or null when the date/time is bookable. */
export function validateBookingTime(
  scheduledAt: Date,
  slotMinutes: number,
  now: number = Date.now(),
): string | null {
  if (Number.isNaN(scheduledAt.getTime())) return "Please enter a valid appointment date and time.";
  if (scheduledAt.getTime() <= now) return "Appointments cannot be booked for a past date or time.";
  if ((CLINIC.closedWeekdays as readonly number[]).includes(scheduledAt.getDay())) {
    return "The clinic is closed on Sundays. Please choose another day.";
  }
  const minutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  if (minutes < CLINIC.openHour * 60 || minutes + slotMinutes > CLINIC.closeHour * 60) {
    return `Please choose a time between ${CLINIC.openHour}:00 and ${CLINIC.closeHour}:00 (clinic working hours).`;
  }
  return null;
}
