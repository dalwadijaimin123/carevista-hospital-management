import { MongoClient, type Collection, type Db } from "mongodb";
import { ENV } from "./_core/env";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  passwordHash: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
> & {
  openId: string;
};

export interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth?: number | null;
  gender: "female" | "male" | "non_binary" | "undisclosed";
  phone?: string | null;
  department: string;
  riskLevel: "low" | "medium" | "high";
  lastVisitAt?: number | null;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string | null;
  patientPhone?: string | null;
  providerName: string;
  department: string;
  appointmentType: string;
  notes?: string | null;
  scheduledAt: number;
  status:
    | "scheduled"
    | "checked_in"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "waiting";
  /** Set only while the appointment holds the doctor's time slot (see SLOT_MINUTES). */
  slotKey?: string | null;
  /** Set when a waiting-list patient was automatically confirmed (shown in the patient portal). */
  promotedAt?: number | null;
  /** Set once the 24-hour reminder e-mail has been sent. */
  reminderSentAt?: number | null;
  /** Set when the patient moved the booking to a new time. */
  rescheduledAt?: number | null;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  updatedAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface PasswordResetOtp {
  email: string;
  otpHash: string;
  expiresAt: Date;
  requestedAt: Date;
  attempts: number;
}

let client: MongoClient | null = null;
let database: Db | null = null;
let connectionPromise: Promise<Db> | null = null;


/*
|--------------------------------------------------------------------------
| DATABASE CONNECTION
|--------------------------------------------------------------------------
*/

export async function getDb(): Promise<Db> {
  if (database) {
    return database;
  }

  if (!ENV.mongoUri) {
    throw new Error(
      "MongoDB is not configured. Set MONGODB_URI in .env",
    );
  }

if (!connectionPromise) {
  connectionPromise = (async () => {
    client = new MongoClient(ENV.mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    await client.connect();

    await client.db("admin").command({
      ping: 1,
    });

    const db = client.db(ENV.mongoDbName);

    await ensureIndexes(db);
    await seedHospitalData(db);

    console.log(
      `[MongoDB] Connected successfully to database: ${ENV.mongoDbName}`,
    );

    database = db;
    return db;
  
  })().catch((error) => {
    connectionPromise = null;
    console.error("[MongoDB] Connection failed:", error);
    throw error;
  });
}

return connectionPromise;
}



/*
|--------------------------------------------------------------------------
| SEED HOSPITAL DATA
|--------------------------------------------------------------------------
*/

async function seedHospitalData(db: Db) {
  const patientsCollection =
    db.collection<Patient>("patients");

  const appointmentsCollection =
    db.collection<Appointment>("appointments");

  const inventoryCollection =
    db.collection<InventoryItem>("inventoryItems");

  const now = new Date();


  /*
  |--------------------------------------------------------------------------
  | SEED PATIENTS
  |--------------------------------------------------------------------------
  */

  if (
    (await patientsCollection.countDocuments()) === 0
  ) {
    const seedPatients: Patient[] = [
      {
        id: crypto.randomUUID(),
        patientCode: "PT-1001",
        fullName: "Priya Shah",
        gender: "female",
        phone: "",
        department: "Cardiology",
        riskLevel: "low",
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        patientCode: "PT-1002",
        fullName: "Liam Wong",
        gender: "male",
        phone: "",
        department: "Cardiology",
        riskLevel: "medium",
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        patientCode: "PT-1003",
        fullName: "Maya Kapoor",
        gender: "female",
        phone: "",
        department: "General Medicine",
        riskLevel: "low",
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        patientCode: "PT-1004",
        fullName: "Arjun Menon",
        gender: "male",
        phone: "",
        department: "Orthopedics",
        riskLevel: "medium",
        createdAt: now,
      },
    ];

    await patientsCollection.insertMany(
      seedPatients,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SEED APPOINTMENTS
  |--------------------------------------------------------------------------
  */

  if (
    (await appointmentsCollection.countDocuments()) === 0
  ) {
    const patientRows =
      await patientsCollection
        .find({})
        .limit(4)
        .toArray();

    const base = Date.now();

    const seedAppointments: Appointment[] =
      patientRows.map((patient, index) => ({
        id: crypto.randomUUID(),

        patientId: patient.id,

        patientName: patient.fullName,

        providerName:
          [
            "Dr. A. Mehta",
            "Dr. N. Rao",
            "Dr. S. Iyer",
            "Dr. A. Mehta",
          ][index] ?? "Dr. A. Mehta",

        department: patient.department,

        appointmentType:
          [
            "Follow-up consultation",
            "Cardiology review",
            "Annual wellness",
            "Post-op review",
          ][index] ?? "Consultation",

        scheduledAt:
          base +
          (index + 1) *
            60 *
            60 *
            1000,

        status:
          [
            "checked_in",
            "in_progress",
            "scheduled",
            "scheduled",
          ][index] as Appointment["status"],

        createdAt: now,
      }));

    await appointmentsCollection.insertMany(
      seedAppointments,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SEED INVENTORY
  |--------------------------------------------------------------------------
  */

  if (
    (await inventoryCollection.countDocuments()) === 0
  ) {
    await inventoryCollection.insertMany([
      {
        id: crypto.randomUUID(),
        itemName: "Amoxicillin 500mg",
        sku: "MED-AMOX-500",
        category: "Antibiotic",
        quantity: 12,
        reorderLevel: 24,
        unit: "boxes",
        status: "low_stock",
        updatedAt: now,
      },

      {
        id: crypto.randomUUID(),
        itemName: "IV Cannula 20G",
        sku: "CON-IV-20G",
        category: "Consumables",
        quantity: 8,
        reorderLevel: 20,
        unit: "packs",
        status: "low_stock",
        updatedAt: now,
      },

      {
        id: crypto.randomUUID(),
        itemName: "Insulin Glargine",
        sku: "MED-INS-GLA",
        category: "Diabetes care",
        quantity: 18,
        reorderLevel: 15,
        unit: "vials",
        status: "in_stock",
        updatedAt: now,
      },
    ]);
  }
}


/*
|--------------------------------------------------------------------------
| DATABASE INDEXES
|--------------------------------------------------------------------------
*/

async function ensureIndexes(db: Db) {
  await db
    .collection("users")
    .createIndex(
      { email: 1 },
      {
        unique: true,
        sparse: true,
      },
    );

  await db
    .collection("users")
    .createIndex(
      { openId: 1 },
      {
        unique: true,
      },
    );

  await db
    .collection("patients")
    .createIndex(
      { patientCode: 1 },
      {
        unique: true,
      },
    );

  await db
    .collection("appointments")
    .createIndex({
      scheduledAt: 1,
    });

  // One confirmed appointment per doctor per time slot (race-condition safe).
  // Waiting-list appointments have no slotKey, so they are not indexed.
  await db
    .collection("appointments")
    .createIndex(
      { slotKey: 1 },
      {
        unique: true,
        sparse: true,
      },
    );

  await db
    .collection("inventoryItems")
    .createIndex(
      { sku: 1 },
      {
        unique: true,
      },
    );

  await db
    .collection("contactMessages")
    .createIndex({
      createdAt: -1,
    });

  await db.collection("passwordResetOtps").createIndex(
    { email: 1 },
    { unique: true },
  );
  await db.collection("passwordResetOtps").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
}


/*
|--------------------------------------------------------------------------
| COLLECTION HELPERS
|--------------------------------------------------------------------------
*/

const users = async () =>
  (await getDb()).collection(
    "users",
  ) as Collection<User>;

const patients = async () =>
  (await getDb()).collection(
    "patients",
  ) as Collection<Patient>;

const appointments = async () =>
  (await getDb()).collection(
    "appointments",
  ) as Collection<Appointment>;

const inventoryItems = async () =>
  (await getDb()).collection(
    "inventoryItems",
  ) as Collection<InventoryItem>;

const contactMessages = async () =>
  (await getDb()).collection(
    "contactMessages",
  ) as Collection<ContactMessage>;


/*
|--------------------------------------------------------------------------
| USER
|--------------------------------------------------------------------------
*/

/**
 * Creates a user if they don't exist.
 * Updates the user if they already exist.
 *
 * IMPORTANT:
 * Fields must NOT be repeated in both $set
 * and $setOnInsert.
 */
export async function upsertUser(
  user: InsertUser,
): Promise<void> {
  const collection = await users();

  const now = new Date();

  /*
   * These fields are updated whenever
   * user information changes.
   */
  const set: Partial<User> = {
    ...(user.name !== undefined
      ? {
          name: user.name ?? null,
        }
      : {}),

    ...(user.email !== undefined
      ? {
          email:
            user.email?.toLowerCase() ?? null,
        }
      : {}),

    ...(user.loginMethod !== undefined
      ? {
          loginMethod:
            user.loginMethod ?? null,
        }
      : {}),

    ...(user.passwordHash !== undefined
      ? {
          passwordHash:
            user.passwordHash ?? null,
        }
      : {}),

    ...(user.role !== undefined
      ? {
          role: user.role,
        }
      : {}),

    ...(user.lastSignedIn !== undefined
      ? {
          lastSignedIn:
            user.lastSignedIn,
        }
      : {}),

    updatedAt: now,
  };

  /*
   * If lastSignedIn was not supplied,
   * update it automatically.
   */
  if (!set.lastSignedIn) {
    set.lastSignedIn = now;
  }


  /*
   * IMPORTANT MONGODB FIX
   *
   * Do NOT add:
   *
   * name
   * email
   * role
   * passwordHash
   * loginMethod
   * lastSignedIn
   *
   * inside $setOnInsert because they
   * already exist inside $set.
   *
   * Otherwise MongoDB gives:
   *
   * MongoServerError:
   * Updating the path 'name' would create
   * a conflict at 'name'
   */
  await collection.updateOne(
    {
      openId: user.openId,
    },

    {
      $set: set,

      $setOnInsert: {
        id: crypto.randomUUID(),

        openId: user.openId,

        createdAt: now,
      },
    },

    {
      upsert: true,
    },
  );
}


/*
|--------------------------------------------------------------------------
| GET USER BY OPEN ID
|--------------------------------------------------------------------------
*/

export async function getUserByOpenId(
  openId: string,
): Promise<User | undefined> {
  const user =
    await (
      await users()
    ).findOne(
      {
        openId,
      },
      {
        projection: {
          _id: 0,
        },
      },
    );

  return user ?? undefined;
}


/*
|--------------------------------------------------------------------------
| GET USER BY EMAIL
|--------------------------------------------------------------------------
*/

export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  const user =
    await (
      await users()
    ).findOne(
      {
        email: email.toLowerCase(),
      },
      {
        projection: {
          _id: 0,
        },
      },
    );

  return user ?? undefined;
}

export async function getPasswordResetOtp(
  email: string,
): Promise<PasswordResetOtp | undefined> {
  const record = await (await getDb())
    .collection<PasswordResetOtp>("passwordResetOtps")
    .findOne({ email: email.toLowerCase() });
  return record ?? undefined;
}

export async function savePasswordResetOtp(
  record: PasswordResetOtp,
): Promise<void> {
  await (await getDb()).collection<PasswordResetOtp>("passwordResetOtps").updateOne(
    { email: record.email.toLowerCase() },
    { $set: { ...record, email: record.email.toLowerCase() } },
    { upsert: true },
  );
}

export async function incrementPasswordResetAttempts(email: string): Promise<void> {
  await (await getDb()).collection<PasswordResetOtp>("passwordResetOtps").updateOne(
    { email: email.toLowerCase() },
    { $inc: { attempts: 1 } },
  );
}

export async function deletePasswordResetOtp(email: string): Promise<void> {
  await (await getDb()).collection<PasswordResetOtp>("passwordResetOtps").deleteOne(
    { email: email.toLowerCase() },
  );
}

/** Atomically consumes a still-valid OTP so concurrent reset requests cannot reuse it. */
export async function consumePasswordResetOtp(email: string, otpHash: string): Promise<boolean> {
  const result = await (await getDb()).collection<PasswordResetOtp>("passwordResetOtps").deleteOne({
    email: email.toLowerCase(),
    otpHash,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 },
  });
  return result.deletedCount === 1;
}


/*
|--------------------------------------------------------------------------
| REGISTERED USERS
|--------------------------------------------------------------------------
*/

export async function getRegisteredUsers() {
  return (await users())
    .find(
      {
        role: "user",
      },
      {
        projection: {
          _id: 0,
          passwordHash: 0,
        },
      },
    )
    .sort({
      createdAt: -1,
    })
    .limit(200)
    .toArray();
}


/*
|--------------------------------------------------------------------------
| CONTACT MESSAGES
|--------------------------------------------------------------------------
*/

export async function createContactMessage(
  message: Omit<
    ContactMessage,
    "id" | "createdAt"
  >,
) {
  const doc: ContactMessage = {
    ...message,

    id: crypto.randomUUID(),

    createdAt: new Date(),
  };

  await (
    await contactMessages()
  ).insertOne(doc);
}


export async function getContactMessages() {
  return (await contactMessages())
    .find(
      {},
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      createdAt: -1,
    })
    .limit(200)
    .toArray();
}


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

export async function getAdminOverview() {
  const [
    patientCount,
    appointmentCount,
    lowStockCount,
    patientRows,
    appointmentRows,
    inventoryRows,
  ] = await Promise.all([
    /*
     * Patient count
     */
    (await patients()).countDocuments(),

    /*
     * Appointment count
     */
    (await appointments()).countDocuments(),

    /*
     * Low stock count
     */
    (await inventoryItems()).countDocuments({
      status: {
        $in: [
          "low_stock",
          "out_of_stock",
        ],
      },
    }),

    /*
     * Recent patients
     */
    (await patients())
      .find(
        {},
        {
          projection: {
            _id: 0,
          },
        },
      )
      .sort({
        createdAt: -1,
      })
      .limit(8)
      .toArray(),

    /*
     * Upcoming appointments
     */
    (await appointments())
      .find(
        {},
        {
          projection: {
            _id: 0,
          },
        },
      )
      .sort({
        scheduledAt: 1,
      })
      .limit(8)
      .toArray(),

    /*
     * Inventory
     */
    (await inventoryItems())
      .find(
        {},
        {
          projection: {
            _id: 0,
          },
        },
      )
      .sort({
        updatedAt: -1,
      })
      .limit(8)
      .toArray(),
  ]);

  return {
    stats: {
      patients: patientCount,

      appointments: appointmentCount,

      lowStock: lowStockCount,

      occupancy: 72,
    },

    patients: patientRows,

    appointments: appointmentRows,

    inventory: inventoryRows,
  };
}


/*
|--------------------------------------------------------------------------
| PATIENTS
|--------------------------------------------------------------------------
*/

export async function searchPatients(
  query?: string,
) {
  const normalized = query?.trim();

  const filter = normalized
    ? {
        $or: [
          {
            fullName: {
              $regex: normalized,
              $options: "i",
            },
          },

          {
            patientCode: {
              $regex: normalized,
              $options: "i",
            },
          },

          {
            department: {
              $regex: normalized,
              $options: "i",
            },
          },
        ],
      }
    : {};

  return (await patients())
    .find(
      filter,
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      createdAt: -1,
    })
    .limit(50)
    .toArray();
}


/*
|--------------------------------------------------------------------------
| APPOINTMENTS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| APPOINTMENT SLOTS / WAITING LIST
|--------------------------------------------------------------------------
*/

// A doctor can see only one patient per slot. Change this to 15/20/60 if needed.
export const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

function slotStart(scheduledAt: number) {
  return Math.floor(scheduledAt / SLOT_MS) * SLOT_MS;
}

function slotKeyFor(providerName: string, scheduledAt: number) {
  return `${providerName}|${slotStart(scheduledAt)}`;
}

export async function createAppointment(
  appointment: Omit<
    Appointment,
    "id" | "createdAt" | "status" | "slotKey"
  >,
) {
  const col = await appointments();

  const base = {
    ...appointment,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };

  // 1) Try to take the slot. The unique index on slotKey guarantees that two
  //    users booking at the same moment can never both get it.
  try {
    const doc: Appointment = {
      ...base,
      status: "scheduled",
      slotKey: slotKeyFor(appointment.providerName, appointment.scheduledAt),
    };

    await col.insertOne(doc);

    return { appointment: doc, waitlisted: false, queuePosition: 0 };
  } catch (error: any) {
    if (error?.code !== 11000) throw error; // not a "slot already taken" error
  }

  // 2) Slot already taken -> save the request in the waiting list.
  const doc: Appointment = { ...base, status: "waiting", slotKey: null };
  delete doc.slotKey;

  await col.insertOne(doc);

  const start = slotStart(appointment.scheduledAt);
  const queuePosition = await col.countDocuments({
    providerName: appointment.providerName,
    status: "waiting",
    scheduledAt: { $gte: start, $lt: start + SLOT_MS },
    createdAt: { $lte: base.createdAt },
  });

  return { appointment: doc, waitlisted: true, queuePosition };
}

/** Booked (and waiting) times of one doctor on one date, for the booking form. */
export async function getTakenSlots(providerName: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(dayStart)) return [];

  const rows = await (
    await appointments()
  )
    .find(
      {
        providerName,
        status: { $in: ["scheduled", "checked_in", "in_progress", "completed", "waiting"] },
        scheduledAt: { $gte: dayStart, $lt: dayStart + 24 * 60 * 60 * 1000 },
      },
      { projection: { _id: 0, scheduledAt: 1, status: 1 } },
    )
    .toArray();

  const map = new Map<number, { booked: boolean; waiting: number }>();
  for (const row of rows) {
    const key = slotStart(row.scheduledAt);
    const entry = map.get(key) ?? { booked: false, waiting: 0 };
    if (row.status === "waiting") entry.waiting += 1;
    else entry.booked = true;
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.booked)
    .sort((a, b) => a[0] - b[0])
    .map(([start, v]) => {
      const d = new Date(start);
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return { time, waiting: v.waiting };
    });
}

/** All appointments of one patient (by e-mail) with waiting-list position. */
export async function getUserAppointments(email: string) {
  const col = await appointments();
  const rows = await col
    .find({ patientEmail: email.toLowerCase() }, { projection: { _id: 0, slotKey: 0 } })
    .sort({ scheduledAt: -1 })
    .toArray();

  return Promise.all(
    rows.map(async (row) => {
      let queuePosition = 0;
      if (row.status === "waiting") {
        const start = slotStart(row.scheduledAt);
        queuePosition = await col.countDocuments({
          providerName: row.providerName,
          status: "waiting",
          scheduledAt: { $gte: start, $lt: start + SLOT_MS },
          createdAt: { $lte: row.createdAt },
        });
      }
      return { ...row, queuePosition };
    }),
  );
}

type StatusResult = {
  updated: boolean;
  promoted: Appointment | null;
  reason?: "not_found" | "slot_taken";
};

/** Confirms the first waiting patient of a freed slot (race-safe through the unique slotKey index). */
async function promoteNextWaiting(
  col: Collection<Appointment>,
  providerName: string,
  scheduledAt: number,
  excludeId?: string,
): Promise<Appointment | null> {
  const start = slotStart(scheduledAt);

  const next = await col.findOne(
    {
      providerName,
      status: "waiting",
      scheduledAt: { $gte: start, $lt: start + SLOT_MS },
      ...(excludeId ? { id: { $ne: excludeId } } : {}),
    },
    { sort: { createdAt: 1 } },
  );

  if (!next) return null;

  const slotKey = slotKeyFor(next.providerName, next.scheduledAt);
  const promotedAt = Date.now();

  try {
    await col.updateOne(
      { id: next.id, status: "waiting" },
      { $set: { status: "scheduled", slotKey, promotedAt } },
    );
    return { ...next, status: "scheduled", slotKey, promotedAt };
  } catch (error: any) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

/**
 * Change an appointment status and keep the slot lock (slotKey) in sync:
 * - cancelled / waiting  -> the slot is released and the first waiting patient is confirmed.
 * - scheduled / checked_in / in_progress / completed -> the slot must be free (unique index),
 *   otherwise "slot_taken" is returned. A waiting patient confirmed by hand is treated like an
 *   automatic promotion (so the caller can notify them).
 */
export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"],
): Promise<StatusResult> {
  const col = await appointments();
  const current = await col.findOne({ id });

  if (!current) return { updated: false, promoted: null, reason: "not_found" };

  const hadSlot = Boolean(current.slotKey);

  if (status === "cancelled" || status === "waiting") {
    if (hadSlot) {
      await col.updateOne({ id }, { $set: { status }, $unset: { slotKey: "" } });
      const promoted = await promoteNextWaiting(col, current.providerName, current.scheduledAt, id);
      return { updated: true, promoted };
    }
    await col.updateOne({ id }, { $set: { status } });
    return { updated: true, promoted: null };
  }

  // Slot-holding status.
  if (hadSlot) {
    await col.updateOne({ id }, { $set: { status } });
    return { updated: true, promoted: null };
  }

  const wasWaiting = current.status === "waiting";
  const slotKey = slotKeyFor(current.providerName, current.scheduledAt);
  const promotedAt = Date.now();

  try {
    await col.updateOne(
      { id },
      { $set: { status, slotKey, ...(wasWaiting ? { promotedAt } : {}) } },
    );
  } catch (error: any) {
    if (error?.code === 11000) return { updated: false, promoted: null, reason: "slot_taken" };
    throw error;
  }

  return {
    updated: true,
    promoted: wasWaiting ? { ...current, status, slotKey, promotedAt } : null,
  };
}

/**
 * Patient moves their own appointment to a new FREE time. The new slot is locked first
 * (unique index), then the old slot is released and its first waiting patient is confirmed.
 */
export async function rescheduleOwnAppointment(
  id: string,
  email: string,
  newScheduledAt: number,
) {
  const col = await appointments();
  const row = await col.findOne({ id, patientEmail: email.toLowerCase() });

  if (!row) return { ok: false as const, reason: "not_found" as const };

  if ((row.status !== "scheduled" && row.status !== "waiting") || row.scheduledAt <= Date.now()) {
    return { ok: false as const, reason: "not_allowed" as const };
  }

  const newKey = slotKeyFor(row.providerName, newScheduledAt);

  if (row.slotKey === newKey) return { ok: false as const, reason: "same_slot" as const };

  try {
    await col.updateOne(
      { id },
      {
        $set: { scheduledAt: newScheduledAt, status: "scheduled", slotKey: newKey, rescheduledAt: Date.now() },
        $unset: { reminderSentAt: "", promotedAt: "" },
      },
    );
  } catch (error: any) {
    if (error?.code === 11000) return { ok: false as const, reason: "slot_taken" as const };
    throw error;
  }

  const promoted = row.slotKey
    ? await promoteNextWaiting(col, row.providerName, row.scheduledAt, id)
    : null;

  const appointment: Appointment = {
    ...row,
    scheduledAt: newScheduledAt,
    status: "scheduled",
    slotKey: newKey,
  };

  return { ok: true as const, appointment, promoted };
}

/** Admin view: every waiting-list entry with its queue position and whether the slot is free now. */
export async function getWaitingList() {
  const col = await appointments();

  const rows = await col
    .find({ status: "waiting" }, { projection: { _id: 0, slotKey: 0 } })
    .sort({ scheduledAt: 1, createdAt: 1 })
    .limit(200)
    .toArray();

  const positions = new Map<string, number>();
  const taken = new Map<string, boolean>();

  return Promise.all(
    rows.map(async (row) => {
      const key = slotKeyFor(row.providerName, row.scheduledAt);
      const queuePosition = (positions.get(key) ?? 0) + 1;
      positions.set(key, queuePosition);

      if (!taken.has(key)) {
        taken.set(key, (await col.countDocuments({ slotKey: key })) > 0);
      }

      return { ...row, queuePosition, slotTaken: taken.get(key) ?? false };
    }),
  );
}

/**
 * Atomically claims confirmed appointments starting within the next 24 hours that have not had a
 * reminder yet. Patients who were just told about the time (booked / confirmed / rescheduled
 * within the last 24h before the visit) are marked as done without sending a second e-mail.
 */
export async function claimDueReminders(): Promise<Appointment[]> {
  const col = await appointments();
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const due: Appointment[] = [];

  for (let i = 0; i < 200; i++) {
    const row = await col.findOneAndUpdate(
      {
        status: "scheduled",
        scheduledAt: { $gt: now, $lte: now + DAY },
        patientEmail: { $exists: true, $nin: [null, ""] },
        reminderSentAt: { $exists: false },
      },
      { $set: { reminderSentAt: now } },
      { returnDocument: "after", projection: { _id: 0 } },
    );

    if (!row) break;

    const informedAt = Math.max(
      new Date(row.createdAt).getTime(),
      row.promotedAt ?? 0,
      row.rescheduledAt ?? 0,
    );

    if (informedAt > row.scheduledAt - DAY) continue; // already told recently

    due.push(row);
  }

  return due;
}

/** Lets the next scheduler run retry a reminder whose e-mail could not be delivered. */
export async function releaseReminder(id: string) {
  await (await appointments()).updateOne({ id }, { $unset: { reminderSentAt: "" } });
}

/** A patient cancels their own booking or waiting-list entry (matched by e-mail). */
export async function cancelOwnAppointment(id: string, email: string) {
  const col = await appointments();
  const row = await col.findOne({ id, patientEmail: email.toLowerCase() });
  if (!row) return { found: false as const };
  if (row.status === "cancelled" || row.status === "completed") {
    return { found: true as const, changed: false, promoted: null as Appointment | null };
  }
  const result = await updateAppointmentStatus(id, "cancelled");
  return { found: true as const, changed: true, promoted: result.promoted };
}

export async function getAppointments() {
  return (await appointments())
    .find(
      {},
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      scheduledAt: 1,
    })
    .limit(100)
    .toArray();
}


/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/

export async function getInventory() {
  return (await inventoryItems())
    .find(
      {},
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      updatedAt: -1,
    })
    .limit(100)
    .toArray();
}

export type CreateInventoryItemInput = {
  itemName: string;
  sku?: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
};

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const normalizedName = input.itemName.trim();
  const skuBase =
    normalizedName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "ITEM";

  const item: InventoryItem = {
    id: crypto.randomUUID(),
    itemName: normalizedName,
    sku:
      input.sku?.trim() ||
      `PH-${skuBase}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    category: input.category.trim(),
    quantity: input.quantity,
    reorderLevel: input.reorderLevel,
    unit: input.unit.trim(),
    status:
      input.quantity === 0
        ? "out_of_stock"
        : input.quantity <= input.reorderLevel
          ? "low_stock"
          : "in_stock",
    updatedAt: new Date(),
  };

  try {
    await (await inventoryItems()).insertOne(item);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("An inventory item with this SKU already exists.");
    }

    throw error;
  }

  return item;
}
