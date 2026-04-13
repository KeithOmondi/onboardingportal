/**
 * Strict media classification using a const object to satisfy 'erasableSyntaxOnly'.
 * Used to determine rendering logic (img vs video tags).
 */
export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  DOCUMENT: "DOCUMENT",
} as const;

// Create a type from the object values for use in interfaces
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

/**
 * Base Album interface for the Gallery Grid.
 * Category is a flexible string to allow for any event type.
 */
export interface IGalleryAlbum {
  id: number;
  title: string;
  category: string; 
  description?: string; 
  event_date: string;   
  location: string;
  thumbnail_url: string;
  media_counts: {       
    images: number;
    videos: number;
    docs: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Individual Media Item interface.
 */
export interface IGalleryMedia {
  id: number;
  album_id: number;
  file_url: string;
  file_type: MediaType; 
  mime_type: string;    
  caption?: string;     
  uploaded_at: string;
}

/**
 * Composite interface for the Album Details view.
 */
export interface IAlbumWithMedia extends IGalleryAlbum {
  media: IGalleryMedia[];
}