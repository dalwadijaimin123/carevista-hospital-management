var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG, decodeOAuthState;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    AXIOS_TIMEOUT_MS = 3e4;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
    decodeOAuthState = (state) => {
      let decoded;
      try {
        decoded = atob(state);
      } catch {
        return { redirectUri: "" };
      }
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed.redirectUri === "string") return parsed;
      } catch {
      }
      return { redirectUri: decoded };
    };
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "carevista-hospital-local",
      cookieSecret: process.env.JWT_SECRET ?? "hospital-local-dev-secret-change-me",
      mongoUri: process.env.MONGODB_URI ?? "",
      mongoDbName: process.env.MONGODB_DB_NAME ?? "hospital_management",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      adminEmail: process.env.ADMIN_EMAIL ?? "admin@hospital.com",
      adminPassword: process.env.ADMIN_PASSWORD ?? "Admin@123",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      passwordResetFrom: process.env.PASSWORD_RESET_FROM ?? "CareVista Hospital <onboarding@resend.dev>",
      appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000"
    };
  }
});

// server/db.ts
import { MongoClient } from "mongodb";
async function getDb() {
  if (database) {
    return database;
  }
  if (!ENV.mongoUri) {
    throw new Error(
      "MongoDB is not configured. Set MONGODB_URI in .env"
    );
  }
  if (!connectionPromise) {
    connectionPromise = (async () => {
      client = new MongoClient(ENV.mongoUri, {
        family: 4,
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 1e4
      });
      await client.connect();
      await client.db("admin").command({
        ping: 1
      });
      const db = client.db(ENV.mongoDbName);
      await ensureIndexes(db);
      await seedHospitalData(db);
      console.log(
        `[MongoDB] Connected successfully to database: ${ENV.mongoDbName}`
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
async function seedHospitalData(db) {
  const patientsCollection = db.collection("patients");
  const appointmentsCollection = db.collection("appointments");
  const inventoryCollection = db.collection("inventoryItems");
  const now = /* @__PURE__ */ new Date();
  if (await patientsCollection.countDocuments() === 0) {
    const seedPatients = [
      {
        id: crypto.randomUUID(),
        patientCode: "PT-1001",
        fullName: "Priya Shah",
        gender: "female",
        phone: "",
        department: "Cardiology",
        riskLevel: "low",
        createdAt: now
      },
      {
        id: crypto.randomUUID(),
        patientCode: "PT-1002",
        fullName: "Liam Wong",
        gender: "male",
        phone: "",
        department: "Cardiology",
        riskLevel: "medium",
        createdAt: now
      },
      {
        id: crypto.randomUUID(),
        patientCode: "PT-1003",
        fullName: "Maya Kapoor",
        gender: "female",
        phone: "",
        department: "General Medicine",
        riskLevel: "low",
        createdAt: now
      },
      {
        id: crypto.randomUUID(),
        patientCode: "PT-1004",
        fullName: "Arjun Menon",
        gender: "male",
        phone: "",
        department: "Orthopedics",
        riskLevel: "medium",
        createdAt: now
      }
    ];
    await patientsCollection.insertMany(
      seedPatients
    );
  }
  if (await appointmentsCollection.countDocuments() === 0) {
    const patientRows = await patientsCollection.find({}).limit(4).toArray();
    const base = Date.now();
    const seedAppointments = patientRows.map((patient, index) => ({
      id: crypto.randomUUID(),
      patientId: patient.id,
      patientName: patient.fullName,
      providerName: [
        "Dr. A. Mehta",
        "Dr. N. Rao",
        "Dr. S. Iyer",
        "Dr. A. Mehta"
      ][index] ?? "Dr. A. Mehta",
      department: patient.department,
      appointmentType: [
        "Follow-up consultation",
        "Cardiology review",
        "Annual wellness",
        "Post-op review"
      ][index] ?? "Consultation",
      scheduledAt: base + (index + 1) * 60 * 60 * 1e3,
      status: [
        "checked_in",
        "in_progress",
        "scheduled",
        "scheduled"
      ][index],
      createdAt: now
    }));
    await appointmentsCollection.insertMany(
      seedAppointments
    );
  }
  if (await inventoryCollection.countDocuments() === 0) {
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
        updatedAt: now
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
        updatedAt: now
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
        updatedAt: now
      }
    ]);
  }
}
async function ensureIndexes(db) {
  await db.collection("users").createIndex(
    { email: 1 },
    {
      unique: true,
      sparse: true
    }
  );
  await db.collection("users").createIndex(
    { openId: 1 },
    {
      unique: true
    }
  );
  await db.collection("patients").createIndex(
    { patientCode: 1 },
    {
      unique: true
    }
  );
  await db.collection("appointments").createIndex({
    scheduledAt: 1
  });
  await db.collection("appointments").createIndex(
    { slotKey: 1 },
    {
      unique: true,
      sparse: true
    }
  );
  await db.collection("inventoryItems").createIndex(
    { sku: 1 },
    {
      unique: true
    }
  );
  await db.collection("contactMessages").createIndex({
    createdAt: -1
  });
  await db.collection("passwordResetOtps").createIndex(
    { email: 1 },
    { unique: true }
  );
  await db.collection("passwordResetOtps").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );
}
async function upsertUser(user) {
  const collection = await users();
  const now = /* @__PURE__ */ new Date();
  const set = {
    ...user.name !== void 0 ? {
      name: user.name ?? null
    } : {},
    ...user.email !== void 0 ? {
      email: user.email?.toLowerCase() ?? null
    } : {},
    ...user.loginMethod !== void 0 ? {
      loginMethod: user.loginMethod ?? null
    } : {},
    ...user.passwordHash !== void 0 ? {
      passwordHash: user.passwordHash ?? null
    } : {},
    ...user.role !== void 0 ? {
      role: user.role
    } : {},
    ...user.lastSignedIn !== void 0 ? {
      lastSignedIn: user.lastSignedIn
    } : {},
    updatedAt: now
  };
  if (!set.lastSignedIn) {
    set.lastSignedIn = now;
  }
  await collection.updateOne(
    {
      openId: user.openId
    },
    {
      $set: set,
      $setOnInsert: {
        id: crypto.randomUUID(),
        openId: user.openId,
        createdAt: now
      }
    },
    {
      upsert: true
    }
  );
}
async function getUserByOpenId(openId) {
  const user = await (await users()).findOne(
    {
      openId
    },
    {
      projection: {
        _id: 0
      }
    }
  );
  return user ?? void 0;
}
async function getUserByEmail(email) {
  const user = await (await users()).findOne(
    {
      email: email.toLowerCase()
    },
    {
      projection: {
        _id: 0
      }
    }
  );
  return user ?? void 0;
}
async function getPasswordResetOtp(email) {
  const record = await (await getDb()).collection("passwordResetOtps").findOne({ email: email.toLowerCase() });
  return record ?? void 0;
}
async function savePasswordResetOtp(record) {
  await (await getDb()).collection("passwordResetOtps").updateOne(
    { email: record.email.toLowerCase() },
    { $set: { ...record, email: record.email.toLowerCase() } },
    { upsert: true }
  );
}
async function incrementPasswordResetAttempts(email) {
  await (await getDb()).collection("passwordResetOtps").updateOne(
    { email: email.toLowerCase() },
    { $inc: { attempts: 1 } }
  );
}
async function deletePasswordResetOtp(email) {
  await (await getDb()).collection("passwordResetOtps").deleteOne(
    { email: email.toLowerCase() }
  );
}
async function consumePasswordResetOtp(email, otpHash) {
  const result = await (await getDb()).collection("passwordResetOtps").deleteOne({
    email: email.toLowerCase(),
    otpHash,
    expiresAt: { $gt: /* @__PURE__ */ new Date() },
    attempts: { $lt: 5 }
  });
  return result.deletedCount === 1;
}
async function getRegisteredUsers() {
  return (await users()).find(
    {
      role: "user"
    },
    {
      projection: {
        _id: 0,
        passwordHash: 0
      }
    }
  ).sort({
    createdAt: -1
  }).limit(200).toArray();
}
async function createContactMessage(message) {
  const doc = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: /* @__PURE__ */ new Date()
  };
  await (await contactMessages()).insertOne(doc);
}
async function getContactMessages() {
  return (await contactMessages()).find(
    {},
    {
      projection: {
        _id: 0
      }
    }
  ).sort({
    createdAt: -1
  }).limit(200).toArray();
}
async function getAdminOverview() {
  const [
    patientCount,
    appointmentCount,
    lowStockCount,
    patientRows,
    appointmentRows,
    inventoryRows
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
          "out_of_stock"
        ]
      }
    }),
    /*
     * Recent patients
     */
    (await patients()).find(
      {},
      {
        projection: {
          _id: 0
        }
      }
    ).sort({
      createdAt: -1
    }).limit(8).toArray(),
    /*
     * Upcoming appointments
     */
    (await appointments()).find(
      {},
      {
        projection: {
          _id: 0
        }
      }
    ).sort({
      scheduledAt: 1
    }).limit(8).toArray(),
    /*
     * Inventory
     */
    (await inventoryItems()).find(
      {},
      {
        projection: {
          _id: 0
        }
      }
    ).sort({
      updatedAt: -1
    }).limit(8).toArray()
  ]);
  return {
    stats: {
      patients: patientCount,
      appointments: appointmentCount,
      lowStock: lowStockCount,
      occupancy: 72
    },
    patients: patientRows,
    appointments: appointmentRows,
    inventory: inventoryRows
  };
}
async function searchPatients(query) {
  const normalized = query?.trim();
  const filter = normalized ? {
    $or: [
      {
        fullName: {
          $regex: normalized,
          $options: "i"
        }
      },
      {
        patientCode: {
          $regex: normalized,
          $options: "i"
        }
      },
      {
        department: {
          $regex: normalized,
          $options: "i"
        }
      }
    ]
  } : {};
  return (await patients()).find(
    filter,
    {
      projection: {
        _id: 0
      }
    }
  ).sort({
    createdAt: -1
  }).limit(50).toArray();
}
function slotStart(scheduledAt) {
  return Math.floor(scheduledAt / SLOT_MS) * SLOT_MS;
}
function slotKeyFor(providerName, scheduledAt) {
  return `${providerName}|${slotStart(scheduledAt)}`;
}
async function createAppointment(appointment) {
  const col = await appointments();
  const base = {
    ...appointment,
    id: crypto.randomUUID(),
    createdAt: /* @__PURE__ */ new Date()
  };
  try {
    const doc2 = {
      ...base,
      status: "scheduled",
      slotKey: slotKeyFor(appointment.providerName, appointment.scheduledAt)
    };
    await col.insertOne(doc2);
    return { appointment: doc2, waitlisted: false, queuePosition: 0 };
  } catch (error) {
    if (error?.code !== 11e3) throw error;
  }
  const doc = { ...base, status: "waiting", slotKey: null };
  delete doc.slotKey;
  await col.insertOne(doc);
  const start = slotStart(appointment.scheduledAt);
  const queuePosition = await col.countDocuments({
    providerName: appointment.providerName,
    status: "waiting",
    scheduledAt: { $gte: start, $lt: start + SLOT_MS },
    createdAt: { $lte: base.createdAt }
  });
  return { appointment: doc, waitlisted: true, queuePosition };
}
async function getTakenSlots(providerName, date) {
  const dayStart = (/* @__PURE__ */ new Date(`${date}T00:00:00`)).getTime();
  if (Number.isNaN(dayStart)) return [];
  const rows = await (await appointments()).find(
    {
      providerName,
      status: { $in: ["scheduled", "checked_in", "in_progress", "completed", "waiting"] },
      scheduledAt: { $gte: dayStart, $lt: dayStart + 24 * 60 * 60 * 1e3 }
    },
    { projection: { _id: 0, scheduledAt: 1, status: 1 } }
  ).toArray();
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const key = slotStart(row.scheduledAt);
    const entry = map.get(key) ?? { booked: false, waiting: 0 };
    if (row.status === "waiting") entry.waiting += 1;
    else entry.booked = true;
    map.set(key, entry);
  }
  return Array.from(map.entries()).filter(([, v]) => v.booked).sort((a, b) => a[0] - b[0]).map(([start, v]) => {
    const d = new Date(start);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return { time, waiting: v.waiting };
  });
}
async function getUserAppointments(email) {
  const col = await appointments();
  const rows = await col.find({ patientEmail: email.toLowerCase() }, { projection: { _id: 0, slotKey: 0 } }).sort({ scheduledAt: -1 }).toArray();
  return Promise.all(
    rows.map(async (row) => {
      let queuePosition = 0;
      if (row.status === "waiting") {
        const start = slotStart(row.scheduledAt);
        queuePosition = await col.countDocuments({
          providerName: row.providerName,
          status: "waiting",
          scheduledAt: { $gte: start, $lt: start + SLOT_MS },
          createdAt: { $lte: row.createdAt }
        });
      }
      return { ...row, queuePosition };
    })
  );
}
async function promoteNextWaiting(col, providerName, scheduledAt, excludeId) {
  const start = slotStart(scheduledAt);
  const next = await col.findOne(
    {
      providerName,
      status: "waiting",
      scheduledAt: { $gte: start, $lt: start + SLOT_MS },
      ...excludeId ? { id: { $ne: excludeId } } : {}
    },
    { sort: { createdAt: 1 } }
  );
  if (!next) return null;
  const slotKey = slotKeyFor(next.providerName, next.scheduledAt);
  const promotedAt = Date.now();
  try {
    await col.updateOne(
      { id: next.id, status: "waiting" },
      { $set: { status: "scheduled", slotKey, promotedAt } }
    );
    return { ...next, status: "scheduled", slotKey, promotedAt };
  } catch (error) {
    if (error?.code === 11e3) return null;
    throw error;
  }
}
async function updateAppointmentStatus(id, status) {
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
      { $set: { status, slotKey, ...wasWaiting ? { promotedAt } : {} } }
    );
  } catch (error) {
    if (error?.code === 11e3) return { updated: false, promoted: null, reason: "slot_taken" };
    throw error;
  }
  return {
    updated: true,
    promoted: wasWaiting ? { ...current, status, slotKey, promotedAt } : null
  };
}
async function rescheduleOwnAppointment(id, email, newScheduledAt) {
  const col = await appointments();
  const row = await col.findOne({ id, patientEmail: email.toLowerCase() });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.status !== "scheduled" && row.status !== "waiting" || row.scheduledAt <= Date.now()) {
    return { ok: false, reason: "not_allowed" };
  }
  const newKey = slotKeyFor(row.providerName, newScheduledAt);
  if (row.slotKey === newKey) return { ok: false, reason: "same_slot" };
  try {
    await col.updateOne(
      { id },
      {
        $set: { scheduledAt: newScheduledAt, status: "scheduled", slotKey: newKey, rescheduledAt: Date.now() },
        $unset: { reminderSentAt: "", promotedAt: "" }
      }
    );
  } catch (error) {
    if (error?.code === 11e3) return { ok: false, reason: "slot_taken" };
    throw error;
  }
  const promoted = row.slotKey ? await promoteNextWaiting(col, row.providerName, row.scheduledAt, id) : null;
  const appointment = {
    ...row,
    scheduledAt: newScheduledAt,
    status: "scheduled",
    slotKey: newKey
  };
  return { ok: true, appointment, promoted };
}
async function getWaitingList() {
  const col = await appointments();
  const rows = await col.find({ status: "waiting" }, { projection: { _id: 0, slotKey: 0 } }).sort({ scheduledAt: 1, createdAt: 1 }).limit(200).toArray();
  const positions = /* @__PURE__ */ new Map();
  const taken = /* @__PURE__ */ new Map();
  return Promise.all(
    rows.map(async (row) => {
      const key = slotKeyFor(row.providerName, row.scheduledAt);
      const queuePosition = (positions.get(key) ?? 0) + 1;
      positions.set(key, queuePosition);
      if (!taken.has(key)) {
        taken.set(key, await col.countDocuments({ slotKey: key }) > 0);
      }
      return { ...row, queuePosition, slotTaken: taken.get(key) ?? false };
    })
  );
}
async function cancelOwnAppointment(id, email) {
  const col = await appointments();
  const row = await col.findOne({ id, patientEmail: email.toLowerCase() });
  if (!row) return { found: false };
  if (row.status === "cancelled" || row.status === "completed") {
    return { found: true, changed: false, promoted: null };
  }
  const result = await updateAppointmentStatus(id, "cancelled");
  return { found: true, changed: true, promoted: result.promoted };
}
async function getAppointments() {
  return (await appointments()).find(
    {},
    {
      projection: {
        _id: 0
      }
    }
  ).sort({
    scheduledAt: 1
  }).limit(100).toArray();
}
async function getInventory() {
  return (await inventoryItems()).find(
    {},
    {
      projection: {
        _id: 0
      }
    }
  ).sort({
    updatedAt: -1
  }).limit(100).toArray();
}
async function createInventoryItem(input) {
  const normalizedName = input.itemName.trim();
  const skuBase = normalizedName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "ITEM";
  const item = {
    id: crypto.randomUUID(),
    itemName: normalizedName,
    sku: input.sku?.trim() || `PH-${skuBase}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    category: input.category.trim(),
    quantity: input.quantity,
    reorderLevel: input.reorderLevel,
    unit: input.unit.trim(),
    status: input.quantity === 0 ? "out_of_stock" : input.quantity <= input.reorderLevel ? "low_stock" : "in_stock",
    updatedAt: /* @__PURE__ */ new Date()
  };
  try {
    await (await inventoryItems()).insertOne(item);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11e3) {
      throw new Error("An inventory item with this SKU already exists.");
    }
    throw error;
  }
  return item;
}
var client, database, connectionPromise, users, patients, appointments, inventoryItems, contactMessages, SLOT_MINUTES, SLOT_MS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_env();
    client = null;
    database = null;
    connectionPromise = null;
    users = async () => (await getDb()).collection(
      "users"
    );
    patients = async () => (await getDb()).collection(
      "patients"
    );
    appointments = async () => (await getDb()).collection(
      "appointments"
    );
    inventoryItems = async () => (await getDb()).collection(
      "inventoryItems"
    );
    contactMessages = async () => (await getDb()).collection(
      "contactMessages"
    );
    SLOT_MINUTES = 30;
    SLOT_MS = SLOT_MINUTES * 60 * 1e3;
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
  }
});

// server/_core/sdk.ts
var sdk_exports = {};
__export(sdk_exports, {
  sdk: () => sdk
});
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: userInfo.openId,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var isNonEmptyString2, EXCHANGE_TOKEN_PATH, GET_USER_INFO_PATH, GET_USER_INFO_WITH_JWT_PATH, OAuthService, createOAuthHttpClient, SDKServer, CRON_OPEN_ID_PREFIX, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_errors();
    init_db();
    init_env();
    isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
    EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
    GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
    GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
    OAuthService = class {
      constructor(client2) {
        this.client = client2;
        if (ENV.oAuthServerUrl) {
          console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
        }
      }
      decodeState(state) {
        return decodeOAuthState(state).redirectUri;
      }
      async getTokenByCode(code, state) {
        const payload = {
          clientId: ENV.appId,
          grantType: "authorization_code",
          code,
          redirectUri: this.decodeState(state)
        };
        const { data } = await this.client.post(
          EXCHANGE_TOKEN_PATH,
          payload
        );
        return data;
      }
      async getUserInfoByToken(token) {
        const { data } = await this.client.post(
          GET_USER_INFO_PATH,
          {
            accessToken: token.accessToken
          }
        );
        return data;
      }
    };
    createOAuthHttpClient = () => axios.create({
      baseURL: ENV.oAuthServerUrl,
      timeout: AXIOS_TIMEOUT_MS
    });
    SDKServer = class {
      client;
      oauthService;
      constructor(client2 = createOAuthHttpClient()) {
        this.client = client2;
        this.oauthService = new OAuthService(this.client);
      }
      deriveLoginMethod(platforms, fallback) {
        if (fallback && fallback.length > 0) return fallback;
        if (!Array.isArray(platforms) || platforms.length === 0) return null;
        const set = new Set(
          platforms.filter((p) => typeof p === "string")
        );
        if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
        if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
        if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
        if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
          return "microsoft";
        if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
        const first = Array.from(set)[0];
        return first ? first.toLowerCase() : null;
      }
      /**
       * Exchange OAuth authorization code for access token
       * @example
       * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
       */
      async exchangeCodeForToken(code, state) {
        return this.oauthService.getTokenByCode(code, state);
      }
      /**
       * Get user information using access token
       * @example
       * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
       */
      async getUserInfo(accessToken) {
        const data = await this.oauthService.getUserInfoByToken({
          accessToken
        });
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      parseCookies(cookieHeader) {
        if (!cookieHeader) {
          return /* @__PURE__ */ new Map();
        }
        const parsed = parseCookieHeader(cookieHeader);
        return new Map(Object.entries(parsed));
      }
      getSessionSecret() {
        const secret = ENV.cookieSecret;
        return new TextEncoder().encode(secret);
      }
      /**
       * Create a session token for a Manus user openId
       * @example
       * const sessionToken = await sdk.createSessionToken(userInfo.openId);
       */
      async createSessionToken(openId, options = {}) {
        return this.signSession(
          {
            openId,
            appId: ENV.appId || "carevista-hospital-local",
            name: options.name || ""
          },
          options
        );
      }
      async signSession(payload, options = {}) {
        const issuedAt = Date.now();
        const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
        const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
        const secretKey = this.getSessionSecret();
        return new SignJWT({
          openId: payload.openId,
          appId: payload.appId,
          name: payload.name
        }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
      }
      async verifySession(cookieValue) {
        if (!cookieValue) {
          console.warn("[Auth] Missing session cookie");
          return null;
        }
        try {
          const secretKey = this.getSessionSecret();
          const { payload } = await jwtVerify(cookieValue, secretKey, {
            algorithms: ["HS256"]
          });
          const { openId, appId, name } = payload;
          if (!isNonEmptyString2(openId) || !isNonEmptyString2(name)) {
            console.warn("[Auth] Session payload missing required fields");
            return null;
          }
          const expectedAppId = ENV.appId || "carevista-hospital-local";
          if (appId !== expectedAppId) {
            console.warn("[Auth] Invalid application ID in session");
            return null;
          }
          return {
            openId,
            appId,
            name
          };
        } catch (error) {
          console.warn("[Auth] Session verification failed", String(error));
          return null;
        }
      }
      async getUserInfoWithJwt(jwtToken) {
        const payload = {
          jwtToken,
          projectId: ENV.appId
        };
        const { data } = await this.client.post(
          GET_USER_INFO_WITH_JWT_PATH,
          payload
        );
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      async authenticateRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        let sessionToken = cookies.get(COOKIE_NAME);
        if (!sessionToken) {
          const authHeader = req.headers.authorization;
          if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
            sessionToken = authHeader.slice(7);
          }
        }
        const session = await this.verifySession(sessionToken);
        if (!session) {
          throw ForbiddenError("Invalid session cookie");
        }
        if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
          const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
          const taskUid = userInfo.taskUid ?? null;
          if (!taskUid) {
            throw ForbiddenError("Cron session missing task_uid");
          }
          return buildCronUser(userInfo);
        }
        const sessionUserId = session.openId;
        const signedInAt = /* @__PURE__ */ new Date();
        if (sessionUserId === "local-admin") {
          return {
            id: "local-admin",
            openId: "local-admin",
            name: "Hospital Administrator",
            email: ENV.adminEmail,
            loginMethod: "local",
            role: "admin",
            createdAt: signedInAt,
            updatedAt: signedInAt,
            lastSignedIn: signedInAt
          };
        }
        if (sessionUserId.startsWith("local-user-")) {
          const localUser = await getUserByOpenId(sessionUserId);
          if (!localUser || localUser.role !== "user") throw ForbiddenError("User account not found");
          await upsertUser({ openId: localUser.openId, lastSignedIn: signedInAt });
          return { ...localUser, lastSignedIn: signedInAt };
        }
        let user = await getUserByOpenId(sessionUserId);
        if (!user) {
          try {
            const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
            await upsertUser({
              openId: userInfo.openId,
              name: userInfo.name || null,
              email: userInfo.email ?? null,
              loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
              lastSignedIn: signedInAt
            });
            user = await getUserByOpenId(userInfo.openId);
          } catch (error) {
            console.error("[Auth] Failed to sync user from OAuth:", error);
            throw ForbiddenError("Failed to sync user info");
          }
        }
        if (!user) {
          throw ForbiddenError("User not found");
        }
        await upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt
        });
        return user;
      }
    };
    CRON_OPEN_ID_PREFIX = "cron_";
    sdk = new SDKServer();
  }
});

// server/vercelApp.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z as z2 } from "zod";

// server/ai/gemini.ts
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
var apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from the server environment.");
}
var DEFAULT_MODEL = "gemini-3.5-flash-lite";
var gemini = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 3e4
  }
});
var instructions = {
  health: [
    "You are CareVista's AI Health Assistant.",
    "Respond in clear, simple English.",
    "Give general health information only.",
    "Do not diagnose conditions or prescribe medicines.",
    "For possible emergencies, advise immediate medical attention.",
    "Keep responses concise, practical, and easy to understand."
  ].join(" "),
  appointment: [
    "You are CareVista's Appointment Assistant.",
    "Respond in clear, simple English.",
    "Help users identify relevant hospital departments and understand appointment booking.",
    "Do not claim an appointment has been booked unless the application confirms it.",
    "Keep responses concise and practical."
  ].join(" "),
  report: [
    "You are CareVista's Medical Report Assistant.",
    "Explain medical terms in simple English.",
    "Consider the provided units and laboratory reference ranges.",
    "Do not diagnose conditions or prescribe treatment.",
    "Recommend discussing results with a qualified healthcare professional.",
    "Keep responses concise."
  ].join(" "),
  admin: [
    "You are CareVista's Hospital Administration Assistant.",
    "Respond in clear, concise English.",
    "Never claim to have accessed or changed hospital records unless the application explicitly confirms that action.",
    "Do not invent hospital statistics or patient information."
  ].join(" ")
};
function getModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}
function getConfig(task, model) {
  const thinkingLevel = model.includes("flash-lite") ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
  return {
    systemInstruction: instructions[task],
    thinkingConfig: {
      thinkingLevel
    },
    maxOutputTokens: task === "report" ? 360 : 280
  };
}
function getErrorText(error) {
  return error instanceof Error ? error.message : String(error);
}
function isRetryable(errorText) {
  return /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL/i.test(
    errorText
  );
}
function logDuration(label, startedAt, model) {
  console.log(
    `[CareVista AI] ${label}: ${Date.now() - startedAt}ms | model=${model}`
  );
}
async function askGemini(task, message) {
  const model = getModel();
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startedAt = Date.now();
    try {
      console.log(
        `[CareVista AI] Request started | attempt=${attempt}/${maxAttempts} | model=${model}`
      );
      const response = await gemini.models.generateContent({
        model,
        contents: message,
        config: getConfig(task, model)
      });
      const answer = response.text?.trim();
      logDuration("Request completed", startedAt, model);
      if (!answer) {
        throw new Error("Gemini returned an empty response.");
      }
      return answer;
    } catch (error) {
      const errorText = getErrorText(error);
      console.error(
        `[CareVista AI] Attempt ${attempt} failed: ${errorText}`
      );
      if (!isRetryable(errorText) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Gemini request failed after retries.");
}

// server/routers.ts
init_const();
init_env();

// server/passwordResetEmail.ts
init_env();
async function sendPasswordResetOtp(email, otp) {
  if (!ENV.resendApiKey) {
    throw new Error("Password reset email delivery is not configured. Set RESEND_API_KEY in .env.");
  }
  const baseUrl = ENV.appBaseUrl.replace(/\/$/, "");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: ENV.passwordResetFrom,
      to: [email],
      subject: "Your CareVista password reset code",
      text: [
        "You requested to reset your CareVista Hospital account password.",
        "",
        `Your one-time verification code is: ${otp}`,
        "This code expires in 10 minutes and can be used only once.",
        "If you did not request this code, you can ignore this email.",
        "",
        `Open the password reset page: ${baseUrl}/forgot-password`
      ].join("\n"),
      html: `<!doctype html><html><body style="margin:0;background:#f5f7f3;font-family:Arial,sans-serif;color:#173d38"><div style="max-width:560px;margin:24px auto;padding:32px;background:#fff;border:1px solid #e2e8e0;border-radius:16px"><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#0d887b;text-transform:uppercase">CareVista Hospital</p><h1 style="font-size:24px">Reset your password</h1><p>You requested to reset the password for your CareVista account. Enter this one-time code on the password reset page:</p><div style="margin:24px 0;padding:18px;text-align:center;background:#edf5f0;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:8px;color:#0e6c63">${otp}</div><p>This code expires in <strong>10 minutes</strong> and can be used only once.</p><p>If you did not request this code, you can safely ignore this email.</p><p><a style="color:#0d766b" href="${baseUrl}/forgot-password">Open password reset</a></p></div></body></html>`
    }),
    signal: AbortSignal.timeout(15e3)
  });
  if (!response.ok) {
    const providerMessage = await response.text().catch(() => "");
    console.error(`[Password Reset] Email provider rejected the request (${response.status}).`, providerMessage.slice(0, 300));
    throw new Error("Could not send password reset email.");
  }
}

// server/appointmentEmail.ts
init_env();

// shared/clinic.ts
var CLINIC = {
  name: "CareVista Hospital",
  openHour: 9,
  closeHour: 17,
  // last slot must END by 17:00
  closedWeekdays: [0],
  // 0 = Sunday
  phone: "+91 79 4000 1234",
  emergencyPhone: "108",
  email: "care@carevista.example",
  address: "CareVista Hospital, SG Highway, Ahmedabad, Gujarat 380054",
  hoursLabel: "Mon\u2013Sat 9:00 AM \u2013 5:00 PM \xB7 Emergency 24\xD77"
};
function validateBookingTime(scheduledAt, slotMinutes, now = Date.now()) {
  if (Number.isNaN(scheduledAt.getTime())) return "Please enter a valid appointment date and time.";
  if (scheduledAt.getTime() <= now) return "Appointments cannot be booked for a past date or time.";
  if (CLINIC.closedWeekdays.includes(scheduledAt.getDay())) {
    return "The clinic is closed on Sundays. Please choose another day.";
  }
  const minutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  if (minutes < CLINIC.openHour * 60 || minutes + slotMinutes > CLINIC.closeHour * 60) {
    return `Please choose a time between ${CLINIC.openHour}:00 and ${CLINIC.closeHour}:00 (clinic working hours).`;
  }
  return null;
}

// server/appointmentEmail.ts
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var when = (ms) => new Date(ms).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });
async function sendMail(to, subject, heading, lines) {
  if (!ENV.resendApiKey) {
    console.warn(`[Email] RESEND_API_KEY not set - skipped "${subject}" to ${to}`);
    return false;
  }
  const baseUrl = ENV.appBaseUrl.replace(/\/$/, "");
  const text = [...lines, "", `Patient portal: ${baseUrl}/user`, `${CLINIC.name} \xB7 ${CLINIC.phone}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f7f3;font-family:Arial,sans-serif;color:#173d38"><div style="max-width:560px;margin:24px auto;padding:32px;background:#fff;border:1px solid #e2e8e0;border-radius:16px"><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#0d887b;text-transform:uppercase">${esc(CLINIC.name)}</p><h1 style="font-size:22px">${esc(heading)}</h1>${lines.map((l) => `<p>${esc(l)}</p>`).join("")}<p><a style="color:#0d766b" href="${baseUrl}/user">Open My appointments</a></p><p style="font-size:12px;color:#82918b">${esc(CLINIC.address)} \xB7 ${esc(CLINIC.phone)}</p></div></body></html>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: ENV.passwordResetFrom, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      console.error(`[Email] Provider rejected "${subject}" (${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}
function sendBookingConfirmed(a) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Your CareVista appointment is confirmed", "Appointment confirmed", [
    `Hello ${a.patientName}, your appointment is confirmed.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Type: ${a.appointmentType}`,
    `When: ${when(a.scheduledAt)}`,
    "Please arrive 10 minutes early. To cancel or change, use My appointments in the patient portal."
  ]);
}
function sendWaitlistJoined(a, queuePosition) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "You are on the CareVista waiting list", "Added to the waiting list", [
    `Hello ${a.patientName}, the slot you chose was already booked, so you were added to the waiting list.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Requested time: ${when(a.scheduledAt)}`,
    `Your position: #${queuePosition}`,
    "If the slot becomes free you will be confirmed automatically and we will email you right away."
  ]);
}
function sendWaitlistPromoted(a) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Good news - your CareVista appointment is confirmed", "Your slot is now confirmed", [
    `Hello ${a.patientName}, a slot became available and your waiting-list request is now CONFIRMED.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `Type: ${a.appointmentType}`,
    `When: ${when(a.scheduledAt)}`,
    "If you can no longer attend, please cancel from My appointments so the next patient can be seated."
  ]);
}
function sendRescheduled(a) {
  if (!a.patientEmail) return Promise.resolve(false);
  return sendMail(a.patientEmail, "Your CareVista appointment was rescheduled", "Appointment rescheduled", [
    `Hello ${a.patientName}, your appointment has been moved to a new time.`,
    `Doctor: ${a.providerName} (${a.department})`,
    `New time: ${when(a.scheduledAt)}`,
    "Your previous time was released. If this was not you, please contact the hospital."
  ]);
}

// server/rateLimit.ts
var hits = /* @__PURE__ */ new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t2) => now - t2 < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5e3) {
    for (const [k, v] of hits) if (v.every((t2) => now - t2 >= windowMs)) hits.delete(k);
  }
  return true;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: isSecureRequest(req) ? "none" : "lax",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
init_const();
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Administrator access is required." });
  }
  return next({ ctx });
});
var scrypt = promisify(scryptCallback);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
function hashResetOtp(email, otp) {
  return createHmac("sha256", ENV.cookieSecret).update(`${email.toLowerCase()}:${otp}`).digest("hex");
}
var demoOverview = {
  stats: { patients: 1284, appointments: 46, lowStock: 7, occupancy: 72 },
  patients: [],
  appointments: [],
  inventory: []
};
var appRouter = router({
  system: systemRouter,
  ai: router({
    ask: publicProcedure.input(
      z2.object({
        task: z2.enum(["health", "appointment", "report"]),
        message: z2.string().trim().min(3).max(4e3)
      })
    ).mutation(async ({ input }) => {
      try {
        const answer = await askGemini(input.task, input.message);
        return { answer };
      } catch (error) {
        console.error(
          "[CareVista AI] Request failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "The AI service is currently unavailable. Please try again later."
        });
      }
    })
  }),
  appointments: router({
    slots: publicProcedure.input(z2.object({ providerName: z2.string().max(80), date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ input }) => ({
      slotMinutes: SLOT_MINUTES,
      booked: await getTakenSlots(input.providerName, input.date)
    })),
    mine: protectedProcedure.query(
      ({ ctx }) => ctx.user.email ? getUserAppointments(ctx.user.email) : []
    ),
    cancel: protectedProcedure.input(z2.object({ id: z2.string().min(1).max(100) })).mutation(async ({ input, ctx }) => {
      if (!ctx.user.email) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Your account has no e-mail address." });
      }
      const result = await cancelOwnAppointment(input.id, ctx.user.email);
      if (!result.found) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Appointment not found." });
      }
      if (result.promoted) void sendWaitlistPromoted(result.promoted);
      return { success: true, promotedNext: Boolean(result.promoted) };
    }),
    reschedule: protectedProcedure.input(
      z2.object({
        id: z2.string().min(1).max(100),
        date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z2.string().regex(/^\d{2}:\d{2}$/)
      })
    ).mutation(async ({ input, ctx }) => {
      if (!ctx.user.email) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Your account has no e-mail address." });
      }
      const newDate = /* @__PURE__ */ new Date(`${input.date}T${input.time}:00`);
      const timeError = validateBookingTime(newDate, SLOT_MINUTES);
      if (timeError) throw new TRPCError3({ code: "BAD_REQUEST", message: timeError });
      const result = await rescheduleOwnAppointment(input.id, ctx.user.email, newDate.getTime());
      if (!result.ok) {
        const messages = {
          not_found: ["NOT_FOUND", "Appointment not found."],
          not_allowed: ["BAD_REQUEST", "Only upcoming confirmed or waiting appointments can be rescheduled."],
          same_slot: ["BAD_REQUEST", "That is the same time slot. Please choose a different time."],
          slot_taken: ["CONFLICT", "That time is already booked. Please choose another time."]
        };
        const [code, message] = messages[result.reason];
        throw new TRPCError3({ code, message });
      }
      void sendRescheduled(result.appointment);
      if (result.promoted) void sendWaitlistPromoted(result.promoted);
      return { success: true, promotedNext: Boolean(result.promoted) };
    }),
    create: publicProcedure.input(
      z2.object({
        patientName: z2.string().trim().min(2).max(180),
        patientEmail: z2.string().trim().email().max(320),
        patientPhone: z2.string().trim().min(5).max(32),
        department: z2.enum([
          "Cardiology",
          "Neurology",
          "Pediatrics",
          "Orthopedics",
          "General Medicine",
          "Pharmacy"
        ]),
        providerName: z2.enum([
          "Dr. A. Mehta",
          "Dr. N. Rao",
          "Dr. S. Iyer",
          "Dr. R. Patel"
        ]),
        appointmentType: z2.enum([
          "Consultation",
          "Follow-up consultation",
          "General check-up",
          "Specialist consultation"
        ]),
        date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z2.string().regex(/^\d{2}:\d{2}$/),
        notes: z2.string().max(2e3).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      if (!rateLimit(`appt:${ctx.req.ip ?? "unknown"}`, 10, 60 * 6e4)) {
        throw new TRPCError3({
          code: "TOO_MANY_REQUESTS",
          message: "Too many booking requests. Please try again in an hour."
        });
      }
      const scheduledDate = /* @__PURE__ */ new Date(
        `${input.date}T${input.time}:00`
      );
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.toISOString().slice(0, 10) !== input.date || !/^\d{2}:\d{2}$/.test(input.time) || Number(input.time.slice(0, 2)) > 23 || Number(input.time.slice(3, 5)) > 59) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Please enter a valid appointment date and time."
        });
      }
      const timeError = validateBookingTime(scheduledDate, SLOT_MINUTES);
      if (timeError) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: timeError });
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
          notes: input.notes?.trim() || null
        });
        void (waitlisted ? sendWaitlistJoined(appointment, queuePosition) : sendBookingConfirmed(appointment));
        return {
          success: true,
          appointmentId: appointment.id,
          waitlisted,
          queuePosition
        };
      } catch (error) {
        console.error("[Appointments] Failed to create appointment:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to save the appointment. Please try again."
        });
      }
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(z2.object({ name: z2.string().trim().min(2).max(180), email: z2.string().email().max(320), password: z2.string().min(8).max(200) })).mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@hospital.com").toLowerCase();
      if (email === adminEmail) throw new TRPCError3({ code: "BAD_REQUEST", message: "This email is reserved for the administrator." });
      const existing = await getUserByEmail(email);
      if (existing) throw new TRPCError3({ code: "CONFLICT", message: "An account with this email already exists. Please login." });
      const passwordHash = await hashPassword(input.password);
      const openId = `local-user-${randomBytes(12).toString("hex")}`;
      await upsertUser({ openId, name: input.name.trim(), email, passwordHash, loginMethod: "local", role: "user", lastSignedIn: /* @__PURE__ */ new Date() });
      return { success: true };
    }),
    login: publicProcedure.input(z2.object({ email: z2.string().email().max(320), password: z2.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      if (!user || user.role !== "user" || !user.passwordHash || !await verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password. If you are new, register first." });
      }
      const signedInAt = /* @__PURE__ */ new Date();
      await upsertUser({ openId: user.openId, lastSignedIn: signedInAt });
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const token = await sdk2.createSessionToken(user.openId, { name: user.name ?? "User" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1e3 * 60 * 60 * 24 * 7 });
      return { success: true, user: { ...user, lastSignedIn: signedInAt } };
    }),
    requestPasswordReset: publicProcedure.input(z2.object({ email: z2.string().trim().email().max(320) })).mutation(async ({ input }) => {
      if (!ENV.resendApiKey) {
        throw new TRPCError3({
          code: "PRECONDITION_FAILED",
          message: "Password reset email is not configured yet. Add RESEND_API_KEY to the server .env file."
        });
      }
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      if (!user || user.role !== "user" || !user.passwordHash) {
        return { success: true };
      }
      const existingOtp = await getPasswordResetOtp(email);
      if (existingOtp && Date.now() - new Date(existingOtp.requestedAt).getTime() < 6e4) {
        return { success: true };
      }
      const otp = String(randomInt(0, 1e6)).padStart(6, "0");
      await savePasswordResetOtp({
        email,
        otpHash: hashResetOtp(email, otp),
        expiresAt: new Date(Date.now() + 10 * 6e4),
        requestedAt: /* @__PURE__ */ new Date(),
        attempts: 0
      });
      try {
        await sendPasswordResetOtp(email, otp);
      } catch (error) {
        await deletePasswordResetOtp(email);
        console.error("[Password Reset] Could not deliver OTP email:", error instanceof Error ? error.message : "Unknown error");
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not send the code. Check the email provider settings and try again."
        });
      }
      return { success: true };
    }),
    resetPassword: publicProcedure.input(z2.object({
      email: z2.string().trim().email().max(320),
      otp: z2.string().regex(/^\d{6}$/, "Enter the six-digit code."),
      password: z2.string().min(8).max(200)
    })).mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      const record = await getPasswordResetOtp(email);
      if (!user || user.role !== "user" || !user.passwordHash || !record) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "The code is invalid or expired. Request a new code." });
      }
      if (new Date(record.expiresAt).getTime() <= Date.now()) {
        await deletePasswordResetOtp(email);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "The code has expired. Request a new code." });
      }
      if (record.attempts >= 5) {
        await deletePasswordResetOtp(email);
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "Too many incorrect attempts. Request a new code." });
      }
      const suppliedHash = Buffer.from(hashResetOtp(email, input.otp), "hex");
      const savedHash = Buffer.from(record.otpHash, "hex");
      if (suppliedHash.length !== savedHash.length || !timingSafeEqual(suppliedHash, savedHash)) {
        await incrementPasswordResetAttempts(email);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "The code is incorrect. Check it and try again." });
      }
      const passwordHash = await hashPassword(input.password);
      const consumed = await consumePasswordResetOtp(email, record.otpHash);
      if (!consumed) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "The code has expired or has already been used. Request a new code." });
      }
      await upsertUser({ openId: user.openId, passwordHash, loginMethod: "local" });
      return { success: true };
    }),
    adminLogin: publicProcedure.input(z2.object({ email: z2.string().email().max(320), password: z2.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@hospital.com";
      const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";
      if (input.email.trim().toLowerCase() !== adminEmail.toLowerCase() || input.password !== adminPassword) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Administrator credentials are incorrect." });
      }
      const signedInAt = /* @__PURE__ */ new Date();
      await upsertUser({ openId: "local-admin", name: "Hospital Administrator", email: adminEmail, loginMethod: "local", role: "admin", lastSignedIn: signedInAt });
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const token = await sdk2.createSessionToken("local-admin", { name: "Hospital Administrator" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1e3 * 60 * 60 * 24 * 7 });
      return { success: true, user: { openId: "local-admin", name: "Hospital Administrator", email: adminEmail, role: "admin", loginMethod: "local", lastSignedIn: signedInAt } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  contact: router({
    send: publicProcedure.input(z2.object({ name: z2.string().trim().min(2).max(180), email: z2.string().email().max(320), phone: z2.string().max(32).optional(), subject: z2.string().trim().min(2).max(180), message: z2.string().trim().min(5).max(5e3) })).mutation(async ({ input, ctx }) => {
      if (!rateLimit(`contact:${ctx.req.ip ?? "unknown"}`, 5, 60 * 6e4)) {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "Too many messages. Please try again later." });
      }
      await createContactMessage({ name: input.name, email: input.email.toLowerCase(), phone: input.phone?.trim() || null, subject: input.subject, message: input.message });
      return { success: true };
    })
  }),
  admin: router({
    overview: adminProcedure2.query(async () => await getAdminOverview() ?? demoOverview),
    patients: adminProcedure2.input(z2.object({ query: z2.string().max(120).optional() }).optional()).query(({ input }) => searchPatients(input?.query)),
    appointments: adminProcedure2.query(() => getAppointments()),
    waitingList: adminProcedure2.query(() => getWaitingList()),
    updateAppointmentStatus: adminProcedure2.input(
      z2.object({
        id: z2.string().min(1),
        status: z2.enum(["scheduled", "checked_in", "in_progress", "completed", "cancelled", "waiting"])
      })
    ).mutation(async ({ input }) => {
      const result = await updateAppointmentStatus(input.id, input.status);
      if (result.reason === "slot_taken") {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "This doctor's slot is already taken by another confirmed patient, so it cannot be confirmed."
        });
      }
      if (result.reason === "not_found") {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Appointment not found." });
      }
      if (result.promoted) void sendWaitlistPromoted(result.promoted);
      return { updated: result.updated, promotedPatient: result.promoted?.patientName ?? null };
    }),
    inventory: adminProcedure2.query(() => getInventory()),
    addInventoryItem: adminProcedure2.input(
      z2.object({
        itemName: z2.string().trim().min(2).max(120),
        sku: z2.string().trim().max(80).optional(),
        category: z2.string().trim().min(2).max(80),
        quantity: z2.number().int().min(0).max(1e7),
        reorderLevel: z2.number().int().min(0).max(1e7),
        unit: z2.enum([
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
          "litres"
        ])
      })
    ).mutation(async ({ input }) => {
      try {
        return await createInventoryItem(input);
      } catch (error) {
        if (error instanceof Error && error.message.includes("SKU already exists")) {
          throw new TRPCError3({
            code: "CONFLICT",
            message: error.message
          });
        }
        console.error(
          "[Pharmacy] Inventory item creation failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "The inventory item could not be saved. Please try again."
        });
      }
    }),
    users: adminProcedure2.query(() => getRegisteredUsers()),
    contacts: adminProcedure2.query(() => getContactMessages()),
    aiAsk: adminProcedure2.input(
      z2.object({
        message: z2.string().trim().min(3).max(1200),
        context: z2.string().max(2400).optional()
      })
    ).mutation(async ({ input }) => {
      try {
        const answer = await askGemini(
          "admin",
          `Administrator request:
${input.message}

Non-identifying operational context:
${input.context ?? "No additional context supplied."}`
        );
        return { answer };
      } catch (error) {
        console.error(
          "[CareOps] Gemini request failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "CareOps \u0AB9\u0ABE\u0AB2\u0AAE\u0ABE\u0A82 \u0A89\u0AAA\u0AB2\u0AAC\u0ACD\u0AA7 \u0AA8\u0AA5\u0AC0. \u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAB\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0AAF\u0ABE\u0AB8 \u0A95\u0AB0\u0ACB."
        });
      }
    })
  })
});

// server/_core/context.ts
init_sdk();
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/vercelApp.ts
init_db();
var app = express();
app.use(express.json({ limit: "4mb" }));
var ready = null;
app.use(async (_req, _res, next) => {
  try {
    ready ??= getDb();
    await ready;
    next();
  } catch (e) {
    ready = null;
    next(e);
  }
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var vercelApp_default = app;
export {
  vercelApp_default as default
};
