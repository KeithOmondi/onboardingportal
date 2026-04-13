// src/interfaces/user.interface.ts

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  JUDGE: 'judge',
  REGISTRAR: 'registrar',
  STAFF: 'staff',
} as const;

// This creates a type from the object values
export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface IUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole; // This now works perfectly
  avatar_url?: string;
  is_verified: boolean;
  needs_password_reset: boolean;
  created_at: Date;
  updated_at: Date;
}