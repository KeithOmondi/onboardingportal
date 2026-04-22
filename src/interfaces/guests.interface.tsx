// src/interfaces/guests.interface.ts
// src/interfaces/guests.interface.ts

export type GuestType = "ADULT" | "MINOR";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type RegistrationStatus = "DRAFT" | "SUBMITTED";

export interface IGuest {
  id?: number;
  registration_id?: number;
  name: string;
  type: GuestType;
  gender: Gender;
  id_number: string | null;
  birth_cert_number: string | null;
  phone: string | null;
  email: string | null;
  // --- New Independent Emergency Fields ---
  emergency_note?: string | null;
  emergency_note_at?: string | null;
  // ---------------------------------------
  created_at?: string;
}

export interface IRegistrationResponse {
  id: number;
  user_id: string;
  status: RegistrationStatus;
  updated_at: string;
  guests: IGuest[];
}

// Add this to your guest interface file or at the top of the slice
export interface IAdminRegistryRow {
  id: number;
  user_id: string;
  judge_name: string;
  status: RegistrationStatus;
  updated_at: string;
  guest_count: string | number;
}