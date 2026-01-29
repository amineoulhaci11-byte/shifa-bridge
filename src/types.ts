export type UserRole = 'PATIENT' | 'DOCTOR';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface Review {
  id: string;
  doctorId: string;
  patientId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  specialty?: string;
  state?: string;
  avatar: string;
  locationUrl?: string;
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
  maxAppointmentsPerDay?: number;
  rating?: number;
  reviewsCount?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  doctorLocation?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string; 
  createdAt: string; 
  isAutoReply?: boolean;
}
