/**
 * Media Type Constant Object
 * Using 'as const' makes this a read-only object with literal types
 */
export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  DOCUMENT: "DOCUMENT"
} as const;

/**
 * MediaType Type Helper
 * This extracts the values ("IMAGE" | "VIDEO" | "DOCUMENT") from the object above
 */
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

/**
 * Main Gallery Item structure matching the PostgreSQL schema
 */
export interface IGalleryItem {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: MediaType;
  mime_type: string;
  created_at: string;
}

/**
 * Redux State structure
 */
export interface IGalleryState {
  items: IGalleryItem[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Payload for the Create action
 */
export interface ICreateGalleryRequest {
  title: string;
  description?: string;
  file: File; 
}