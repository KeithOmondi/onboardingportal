export type EventStatus = 'UPCOMING' | 'PAST' | 'ONGOING' | 'ALL';

export interface IJudicialEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  /** ISO 8601 string format: YYYY-MM-DDTHH:mm:ssZ or with offset +03:00 */
  start_time: string; 
  end_time: string;
  is_virtual: boolean;
  organizer: string;
  /** * Computed by the DB via our CASE logic. 
   * Frontend uses this as the "Source of Truth" for display. 
   */
  current_status?: Exclude<EventStatus, 'ALL'>;
  created_at?: string;
  updated_at?: string;
}

export interface ICreateEventPayload {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
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