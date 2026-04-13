// server/src/interfaces/court.interface.ts

/**
 * judicial_officials table interface
 */
export interface IJudicialOfficial {
  id: string;
  name: string;
  designation: string;
  image_url: string | null;
  mandate_body: string | null;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * court_faqs table interface
 */
export interface ICourtFaq {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
  created_at?: Date;
}

/**
 * court_mandates table interface
 */
export interface ICourtMandate {
  id: string;
  title: string;
  detail: string;
  is_primary: boolean;
  pillar_order: number;
  created_at?: Date;
}

/**
 * The response shape for our /init route
 */
export interface ICourtManagementData {
  officials: IJudicialOfficial[];
  faqs: ICourtFaq[];
  mandates: ICourtMandate[];
}