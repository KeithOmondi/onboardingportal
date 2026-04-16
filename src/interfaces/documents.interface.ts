export interface IDocument {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  document_type: string;
  file_size: number | null;
  mime_type: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IDocumentState {
  documents: IDocument[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  success: boolean;
}

export interface ICreateDocumentPayload {
  title: string;
  description?: string;
  document_type?: string;
  file: File; // The actual file object for FormData
}

export interface IDocumentQuery {
  document_type?: string;
  search?: string;
}