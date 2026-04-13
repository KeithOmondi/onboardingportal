export type NoticeCategory = "URGENT" | "DEADLINE" | "INFO" | "WELCOME";

/**
 * Base structure for a Notice as it exists in the database.
 */
export interface INoticeBase {
  id: number;
  title: string;
  body: string; 
  category: NoticeCategory;
  attachment_url: string | null; 
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
  author: string; 
}

/**
 * Interface for the Judge/Staff view.
 */
export interface INotice extends INoticeBase {
  is_read: boolean;
}

/**
 * Interface for the Admin view.
 */
export interface IAdminNotice extends Omit<INoticeBase, 'body'> {
  is_active: boolean;
  read_count: number;
  body?: string; 
}

/**
 * Payload for creating a new notice.
 * Replaced 'any' with 'File | null' for type safety.
 */
export interface ICreateNoticeRequest {
  title: string;
  body: string;
  category: NoticeCategory;
  expires_at?: string | null;
  file?: File | null; 
}

/**
 * Payload for updating an existing notice.
 */
export interface IUpdateNoticeRequest extends Partial<ICreateNoticeRequest> {
  id: number;
  is_active?: boolean;
}