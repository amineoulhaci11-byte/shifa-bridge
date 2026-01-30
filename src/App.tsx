import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './services/supabase';
import { UserRole, User, Appointment, AppointmentStatus, Message, Review } from './types';

import Auth from './components/Auth';
import Navbar from './components/Navbar';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import ChatCenter from './components/ChatCenter';
import RegisterPatient from './components/RegisterPatient';
import RegisterDoctor from './components/RegisterDoctor';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'AUTH' | 'REGISTER_PATIENT' | 'REGISTER_DOCTOR' | 'APP'>('AUTH');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase.from('reviews').select('*');
    if (data) {
      setReviews(data.map((r: any) => ({
        id: r.id.toString(), doctorId: r.doctor_id, patientId: r.patient_id, rating: r.rating, comment: r.comment, createdAt: r.created_at
      })));
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    const { data } = await supabase.from('doctors').select('*');
    if (data) {
      setDoctors(data.map((d: any) => ({
        id: d.id.toString(), name: d.full_name, role: 'DOCTOR' as UserRole, specialty: d.specialty, state: d.state, 
        locationUrl: d.clinic_location, autoReplyEnabled: d.auto_reply_enabled || false, autoReplyMessage: d.auto_reply_text || '',
        maxAppointmentsPerDay: d.max_appointments_per_day || 20,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.full_name)}&background=312e81&color=fff`,
        rating: 0, reviewsCount: 0
      })));
    }
  }, []);

  // === دالة جلب المواعيد (تستخدم العمود الجديد status) ===
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('appointments').select('*');
      query = user.role === 'PATIENT' ? query.eq('patient_id', user.id) : query.eq('doctor_id', user.id);
      
      const { data: apptsData } = await query.order('appointment_date', { ascending: true });
      if (!apptsData) { setAppointments([]); return; }
      
      const patientIds = Array.from(new Set(apptsData.map((a: any) => a.patient_id)));
      const doctorIds = Array.from(new Set(apptsData.map((a: any) => a.doctor_id)));
      
      const [patientsRes, doctorsRes] = await Promise.all([
        patientIds.length ? supabase.from('patients').select('id, full_name').in('id', patientIds) : { data: [] },
        doctorIds.length ? supabase.from('doctors').select('id, full_name, clinic_location').in('id', doctorIds) : { data: [] }
      ]);
      
      const patientsMap: Record<string, string> = {};
      patientsRes.data?.forEach((p: any) => { patientsMap[p.id] = p.full_name; });
      const doctorsMap: Record<string, string> = {};
      const doctorsLocationMap: Record<string, string> = {};
      doctorsRes.data?.forEach((d: any) => { 
        doctorsMap[d.id] = d.full_name;
        
