export interface IEmergencyNote {
  id: number;
  registration_id: number;
  note: string;
  updated_at: string;
  judge_email?: string; // joined from registrations on GET
}

export interface IEmergencyResponse {
  status: string;
  message?: string;
  data: IEmergencyNote | null;
}

export interface IEmergencyState {
  note: IEmergencyNote | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface IApiError {
  message: string;
  status?: string;
}