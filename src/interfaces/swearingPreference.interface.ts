export type CeremonyChoice = 'oath' | 'affirmation';

export interface ISwearingPreference {
  id?: string;
  user_id: string;
  ceremony_choice: CeremonyChoice;
  religious_text: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  full_name?: string;     // Flattened field
  designation?: string;  // Flattened field
}

// Added 'export' here so the Admin/Slice can see it
export interface SwearingPreferencePayload {
  ceremonyChoice: CeremonyChoice;
  religiousText: string;
}