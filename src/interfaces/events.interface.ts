// src/interfaces/events.interface.ts

export type EventStatus = "UPCOMING" | "PAST" | "ONGOING" | "ALL";

export interface IJudicialEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string; // ISO String from PostgreSQL
  end_time: string;   // ISO String from PostgreSQL
  is_virtual: boolean;
  organizer: string;
  created_at?: string;
  updated_at?: string;
}

export interface IGetEventsQuery {
  status?: EventStatus;
  search?: string;
}