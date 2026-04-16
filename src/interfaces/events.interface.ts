export type EventStatus = 'UPCOMING' | 'PAST' | 'ONGOING' | 'ALL';

export interface IJudicialEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: Date | string;
  end_time: Date | string;
  is_virtual: boolean;
  organizer: string;
  // Computed by the DB on every query — do not send these to the server
  current_status?: EventStatus;
  is_past?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ICreateEventPayload {
  title: string;
  description: string;
  location: string;
  start_time: Date | string;
  end_time: Date | string;
  is_virtual?: boolean;
  organizer: string;
}

export interface IUpdateEventPayload extends Partial<ICreateEventPayload> {
  id: number;
}

export interface IGetEventsQuery {
  status?: EventStatus;
  search?: string;
}