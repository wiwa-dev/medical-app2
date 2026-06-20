export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  diagnostic: string;
  observations: string;
  lastDocument?: string;
  status: 'regular' | 'urgent';
  createdAt: Date;
}

export type PatientFormData = Omit<Patient, 'id' | 'createdAt'>;





