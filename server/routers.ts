import { TRPCError } from "@trpc/server";
import { createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { askGemini } from "./ai/gemini";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { sendPasswordResetOtp } from "./passwordResetEmail";
import { sendBookingConfirmed, sendRescheduled, sendWaitlistJoined, sendWaitlistPromoted } from "./appointmentEmail";
import { rateLimit } from "./rateLimit";
import { validateBookingTime } from "@shared/clinic";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAppointment,
  updateAppointmentStatus,
  cancelOwnAppointment,
  rescheduleOwnAppointment,
  getWaitingList,
  getTakenSlots,
  getUserAppointments,
  SLOT_MINUTES,
  createContactMessage,
  getAdminOverview,
  getAppointments,
  getContactMessages,
  getInventory,
  createInventoryItem,
  getRegisteredUsers,
  getUserByEmail,
  getPasswordResetOtp,
  incrementPasswordResetAttempts,
  deletePasswordResetOtp,
  consumePasswordResetOtp,
  savePasswordResetOtp,
  searchPatients,
  upsertUser,
} from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  }
  return next({ ctx });
});

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function hashResetOtp(email: string, otp: string) {
  return createHmac("sha256", ENV.cookieSecret)
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

const demoOverview = {
  stats: { patients: 1284, appointments: 46, lowStock: 7, occupancy: 72 },
  patients: [],
  appointments: [],
  inventory: [],
};

export const appRouter = router({
  system: systemRouter,

  
  ai: router({
    ask: publicProcedure
      .input(
        z.object({
          task: z.enum(["health", "appointment", "report"]),
          message: z.string().trim().min(3).max(4000),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const answer = await askGemini(input.task, input.message);
          return { answer };
        } catch (error) {
          console.error(
            "[CareVista AI] Request failed:",
            error instanceof Error ? error.message : "Unknown error",
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The AI service is currently unavailable. Please try again later.",
          });
        }
      }),
  }),

  
  appointments: router({
    slots: publicProcedure
      .input(z.object({ providerName: z.string().max(80), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => ({
        slotMinutes: SLOT_MINUTES,
        booked: await getTakenSlots(input.providerName, input.date),
      })),

    mine: protectedProcedure.query(({ ctx }) =>
      ctx.user.email ? getUserAppointments(ctx.user.email) : [],
    ),

    cancel: protectedProcedure
      .input(z.object({ id: z.string().min(1).max(100) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no e-mail address." });
        }
        const result = await cancelOwnAppointment(input.id, ctx.user.email);
        if (!result.found) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found." });
        }
        if (result.promoted) void sendWaitlistPromoted(result.promoted);
        return { success: true, promotedNext: Boolean(result.promoted) };
      }),

    reschedule: protectedProcedure
      .input(
        z.object({
          id: z.string().min(1).max(100),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          time: z.string().regex(/^\d{2}:\d{2}$/),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no e-mail address." });
        }

        const newDate = new Date(`${input.date}T${input.time}:00`);
        const timeError = validateBookingTime(newDate, SLOT_MINUTES);
        if (timeError) throw new TRPCError({ code: "BAD_REQUEST", message: timeError });

        const result = await rescheduleOwnAppointment(input.id, ctx.user.email, newDate.getTime());

        if (!result.ok) {
          const messages = {
            not_found: ["NOT_FOUND", "Appointment not found."],
            not_allowed: ["BAD_REQUEST", "Only upcoming confirmed or waiting appointments can be rescheduled."],
            same_slot: ["BAD_REQUEST", "That is the same time slot. Please choose a different time."],
            slot_taken: ["CONFLICT", "That time is already booked. Please choose another time."],
          } as const;
          const [code, message] = messages[result.reason];
          throw new TRPCError({ code, message });
        }

        void sendRescheduled(result.appointment);
        if (result.promoted) void sendWaitlistPromoted(result.promoted);

        return { success: true, promotedNext: Boolean(result.promoted) };
      }),

    create: publicProcedure
      .input(
        z.object({
          patientName: z.string().trim().min(2).max(180),
          patientEmail: z.string().trim().email().max(320),
          patientPhone: z.string().trim().min(5).max(32),
          department: z.enum([
            "Cardiology",
            "Neurology",
            "Pediatrics",
            "Orthopedics",
            "General Medicine",
            "Pharmacy",
          ]),
          providerName: z.enum([
            "Dr. A. Mehta",
            "Dr. N. Rao",
            "Dr. S. Iyer",
            "Dr. R. Patel",
          ]),
          appointmentType: z.enum([
            "Consultation",
            "Follow-up consultation",
            "General check-up",
            "Specialist consultation",
          ]),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          time: z.string().regex(/^\d{2}:\d{2}$/),
          notes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!rateLimit(`appt:${ctx.req.ip ?? "unknown"}`, 10, 60 * 60_000)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many booking requests. Please try again in an hour.",
          });
        }

        const scheduledDate = new Date(
          `${input.date}T${input.time}:00`,
        );

        if (
          Number.isNaN(scheduledDate.getTime()) ||
          scheduledDate.toISOString().slice(0, 10) !== input.date ||
          !/^\d{2}:\d{2}$/.test(input.time) ||
          Number(input.time.slice(0, 2)) > 23 ||
          Number(input.time.slice(3, 5)) > 59
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid appointment date and time.",
          });
        }

        const timeError = validateBookingTime(scheduledDate, SLOT_MINUTES);
        if (timeError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: timeError });
        }

        try {
          const { appointment, waitlisted, queuePosition } = await createAppointment({
            patientId: `web-${randomBytes(12).toString("hex")}`,
            patientName: input.patientName,
            patientEmail: input.patientEmail.toLowerCase(),
            patientPhone: input.patientPhone,
            department: input.department,
            providerName: input.providerName,
            appointmentType: input.appointmentType,
            scheduledAt: scheduledDate.getTime(),
            notes: input.notes?.trim() || null,
          });

          // Confirmation / waiting-list e-mail (never blocks or breaks the booking).
          void (waitlisted
            ? sendWaitlistJoined(appointment, queuePosition)
            : sendBookingConfirmed(appointment));

          return {
            success: true,
            appointmentId: appointment.id,
            waitlisted,
            queuePosition,
          };
        } catch (error) {
          console.error("[Appointments] Failed to create appointment:", error);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to save the appointment. Please try again.",
          });
        }
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(z.object({ name: z.string().trim().min(2).max(180), email: z.string().email().max(320), password: z.string().min(8).max(200) }))
      .mutation(async ({ input }) => {
        const email = input.email.trim().toLowerCase();
        const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@hospital.com").toLowerCase();
        if (email === adminEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "This email is reserved for the administrator." });
        const existing = await getUserByEmail(email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please login." });
        const passwordHash = await hashPassword(input.password);
        const openId = `local-user-${randomBytes(12).toString("hex")}`;
        await upsertUser({ openId, name: input.name.trim(), email, passwordHash, loginMethod: "local", role: "user", lastSignedIn: new Date() });
        return { success: true };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        if (!user || user.role !== "user" || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password. If you are new, register first." });
        }
        const signedInAt = new Date();
        await upsertUser({ openId: user.openId, lastSignedIn: signedInAt });
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "User" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
        return { success: true, user: { ...user, lastSignedIn: signedInAt } };
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320) }))
      .mutation(async ({ input }) => {
        if (!ENV.resendApiKey) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Password reset email is not configured yet. Add RESEND_API_KEY to the server .env file.",
          });
        }

        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        // Always return the same success response for unknown accounts and admin addresses.
        if (!user || user.role !== "user" || !user.passwordHash) {
          return { success: true };
        }

        const existingOtp = await getPasswordResetOtp(email);
        if (existingOtp && Date.now() - new Date(existingOtp.requestedAt).getTime() < 60_000) {
          return { success: true };
        }

        const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
        await savePasswordResetOtp({
          email,
          otpHash: hashResetOtp(email, otp),
          expiresAt: new Date(Date.now() + 10 * 60_000),
          requestedAt: new Date(),
          attempts: 0,
        });

        try {
          await sendPasswordResetOtp(email, otp);
        } catch (error) {
          await deletePasswordResetOtp(email);
          console.error("[Password Reset] Could not deliver OTP email:", error instanceof Error ? error.message : "Unknown error");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "We could not send the code. Check the email provider settings and try again.",
          });
        }

        return { success: true };
      }),
    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().trim().email().max(320),
        otp: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
        password: z.string().min(8).max(200),
      }))
      .mutation(async ({ input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        const record = await getPasswordResetOtp(email);

        if (!user || user.role !== "user" || !user.passwordHash || !record) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "The code is invalid or expired. Request a new code." });
        }
        if (new Date(record.expiresAt).getTime() <= Date.now()) {
          await deletePasswordResetOtp(email);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "The code has expired. Request a new code." });
        }
        if (record.attempts >= 5) {
          await deletePasswordResetOtp(email);
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many incorrect attempts. Request a new code." });
        }

        const suppliedHash = Buffer.from(hashResetOtp(email, input.otp), "hex");
        const savedHash = Buffer.from(record.otpHash, "hex");
        if (suppliedHash.length !== savedHash.length || !timingSafeEqual(suppliedHash, savedHash)) {
          await incrementPasswordResetAttempts(email);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "The code is incorrect. Check it and try again." });
        }

        const passwordHash = await hashPassword(input.password);
        const consumed = await consumePasswordResetOtp(email, record.otpHash);
        if (!consumed) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "The code has expired or has already been used. Request a new code." });
        }
        await upsertUser({ openId: user.openId, passwordHash, loginMethod: "local" });
        return { success: true };
      }),
    adminLogin: publicProcedure
      .input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const adminEmail = process.env.ADMIN_EMAIL ?? "admin@hospital.com";
        const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";
        if (input.email.trim().toLowerCase() !== adminEmail.toLowerCase() || input.password !== adminPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Administrator credentials are incorrect." });
        }
        const signedInAt = new Date();
        await upsertUser({ openId: "local-admin", name: "Hospital Administrator", email: adminEmail, loginMethod: "local", role: "admin", lastSignedIn: signedInAt });
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken("local-admin", { name: "Hospital Administrator" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
        return { success: true, user: { openId: "local-admin", name: "Hospital Administrator", email: adminEmail, role: "admin", loginMethod: "local", lastSignedIn: signedInAt } };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  contact: router({
    send: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(180), email: z.string().email().max(320), phone: z.string().max(32).optional(), subject: z.string().trim().min(2).max(180), message: z.string().trim().min(5).max(5000) })).mutation(async ({ input, ctx }) => {
      if (!rateLimit(`contact:${ctx.req.ip ?? "unknown"}`, 5, 60 * 60_000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many messages. Please try again later." });
      }
      await createContactMessage({ name: input.name, email: input.email.toLowerCase(), phone: input.phone?.trim() || null, subject: input.subject, message: input.message });
      return { success: true };
    }),
  }),
  admin: router({
    overview: adminProcedure.query(async () => (await getAdminOverview()) ?? demoOverview),
    patients: adminProcedure.input(z.object({ query: z.string().max(120).optional() }).optional()).query(({ input }) => searchPatients(input?.query)),
    appointments: adminProcedure.query(() => getAppointments()),
    waitingList: adminProcedure.query(() => getWaitingList()),
    updateAppointmentStatus: adminProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(["scheduled", "checked_in", "in_progress", "completed", "cancelled", "waiting"]),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await updateAppointmentStatus(input.id, input.status);
        if (result.reason === "slot_taken") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This doctor's slot is already taken by another confirmed patient, so it cannot be confirmed.",
          });
        }
        if (result.reason === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found." });
        }
        if (result.promoted) void sendWaitlistPromoted(result.promoted);
        return { updated: result.updated, promotedPatient: result.promoted?.patientName ?? null };
      }),
    inventory: adminProcedure.query(() => getInventory()),
    addInventoryItem: adminProcedure
      .input(
        z.object({
          itemName: z.string().trim().min(2).max(120),
          sku: z.string().trim().max(80).optional(),
          category: z.string().trim().min(2).max(80),
          quantity: z.number().int().min(0).max(10000000),
          reorderLevel: z.number().int().min(0).max(10000000),
          unit: z.enum([
            "tablets",
            "capsules",
            "bottles",
            "vials",
            "boxes",
            "packs",
            "strips",
            "pieces",
            "units",
            "ml",
            "litres",
          ]),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await createInventoryItem(input);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("SKU already exists")
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.message,
            });
          }

          console.error(
            "[Pharmacy] Inventory item creation failed:",
            error instanceof Error ? error.message : "Unknown error",
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The inventory item could not be saved. Please try again.",
          });
        }
      }),
    users: adminProcedure.query(() => getRegisteredUsers()),
    contacts: adminProcedure.query(() => getContactMessages()),
    
    aiAsk: adminProcedure
      .input(
        z.object({
          message: z.string().trim().min(3).max(1200),
          context: z.string().max(2400).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const answer = await askGemini(
            "admin",
            `Administrator request:\n${input.message}\n\nNon-identifying operational context:\n${input.context ?? "No additional context supplied."}`,
          );

          return { answer };
        } catch (error) {
          console.error(
            "[CareOps] Gemini request failed:",
            error instanceof Error ? error.message : "Unknown error",
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "CareOps હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
          });
        }
      }),

  }),
});

export type AppRouter = typeof appRouter;
