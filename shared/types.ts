/** Shared application types. MongoDB is the application's only database. */
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  passwordHash?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

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
  providerName: string;
  department: string;
  appointmentType: string;
  scheduledAt: number;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
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

export * from "./_core/errors";
