export type DocumentType = 'certificat' | 'decision' | 'lettre';

export interface DocumentTemplate {
  Type: DocumentType;
  Title: string;
  Icon: string;
  Loaded: boolean;
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  patientId: string;
  patientName: string;
  createdAt: Date;
  content: string;
}
