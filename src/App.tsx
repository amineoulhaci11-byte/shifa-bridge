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

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('appointments').select('*');
      query = user.role === 'PATIENT' ? query.eq('patient_id', user.id) : query.eq('doctor_id', user.id);
      const { data: apptsData } = await query.order('appointment_date', { ascending: true });
      if (!apptsData || apptsData.length === 0) { setAppointments([]); return; }
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
        if (d.clinic_location) doctorsLocationMap[d.id] = d.clinic_location;
      });
      setAppointments(apptsData.map((a: any) => ({
        id: a.id.toString(), patientId: a.patient_id.toString(), doctorId: a.doctor_id.toString(),
        patientName: patientsMap[a.patient_id] || 'مريض', doctorName: doctorsMap[a.doctor_id] || 'طبيب',
        doctorLocation: doctorsLocationMap[a.doctor_id], date: a.appointment_date, time: a.appointment_time,
        status: (a.status ? a.status.toUpperCase() : 'PENDING') as AppointmentStatus, notes: a.notes || '' 
      })));
    } catch (e) { console.error(e); }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id.toString(), senderId: m.sender_id, receiverId: m.receiver_id, content: m.content, createdAt: m.created_at, isAutoReply: m.is_auto_reply
      })));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDoctors(); fetchAppointments(); fetchMessages(); fetchReviews();
      const channels = [
        supabase.channel('public:appointments').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => setTimeout(fetchAppointments, 500)).subscribe(),
        supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new;
          if (m.sender_id === user.id || m.receiver_id === user.id) {
            setMessages(prev => { if (prev.some(msg => msg.id === m.id.toString())) return prev; return [...prev, { id: m.id.toString(), senderId: m.sender_id, receiverId: m.receiver_id, content: m.content, createdAt: m.created_at, isAutoReply: m.is_auto_reply }]; });
          }
        }).subscribe(),
        supabase.channel('public:doctors').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doctors' }, (payload) => {
          const updated = payload.new;
          setDoctors(prev => prev.map(d => d.id === updated.id.toString() ? { ...d, name: updated.full_name, specialty: updated.specialty, state: updated.state, locationUrl: updated.clinic_location, autoReplyEnabled: updated.auto_reply_enabled, autoReplyMessage: updated.auto_reply_text, maxAppointmentsPerDay: updated.max_appointments_per_day } : d));
        }).subscribe(),
        supabase.channel('public:reviews').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, fetchReviews).subscribe()
      ];
      return () => { channels.forEach(channel => supabase.removeChannel(channel)); };
    }
  }, [user, fetchDoctors, fetchAppointments, fetchMessages, fetchReviews]);

  const doctorsWithRatings = useMemo(() => {
    return doctors.map(doc => {
      const docReviews = reviews.filter(r => r.doctorId === doc.id);
      const total = docReviews.reduce((sum, r) => sum + r.rating, 0);
      const avg = docReviews.length > 0 ? total / docReviews.length : 0;
      return { ...doc, rating: parseFloat(avg.toFixed(1)), reviewsCount: docReviews.length };
    });
  }, [doctors, reviews]);

  const chatContacts = useMemo(() => {
    if (!user) return [];
    if (user.role === 'PATIENT') {
      const myDoctorIds = new Set(appointments.map(a => a.doctorId));
      return doctors.filter(doc => myDoctorIds.has(doc.id));
    } else {
      const uniquePatients = new Map<string, User>();
      appointments.forEach(appt => {
        if (!uniquePatients.has(appt.patientId)) {
          uniquePatients.set(appt.patientId, { id: appt.patientId, name: appt.patientName, role: 'PATIENT' as UserRole, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientName)}&background=random` });
        }
      });
      return Array.from(uniquePatients.values());
    }
  }, [user, appointments, doctors]);

  const handleLogin = async (role: UserRole, userData?: User) => {
    if (!userData) return;
    if (role === 'DOCTOR') {
        const { data } = await supabase.from('doctors').select('*').eq('id', userData.id).single();
        if (data) {
             setUser({ ...userData, autoReplyEnabled: data.auto_reply_enabled, autoReplyMessage: data.auto_reply_text, maxAppointmentsPerDay: data.max_appointments_per_day });
        } else { setUser(userData); }
    } else { setUser(userData); }
    setView('APP');
  };

  const addAppointment = async (apptData: Omit<Appointment, 'id' | 'status'> | Omit<Appointment, 'id' | 'status'>[]): Promise<boolean> => {
    try {
      const appts = Array.isArray(apptData) ? apptData : [apptData];
      for (const appt of appts) {
        const { data: existingAppt } = await supabase.from('appointments').select('id').eq('doctor_id', appt.doctorId).eq('appointment_date', appt.date).eq('appointment_time', appt.time).maybeSingle();
        if (existingAppt) { alert(`الموعد الساعة ${appt.time} محجوز مسبقاً!`); return false; }
      }
      const payload = appts.map(appt => ({ patient_id: appt.patientId, doctor_id: appt.doctorId, appointment_date: appt.date, appointment_time: appt.time, status: 'PENDING', notes: appt.notes || '' }));
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) throw error;
      await fetchAppointments(); return true;
    } catch (err: any) { alert(`فشل الحجز: ${err.message}`); return false; }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) await fetchAppointments();
  };

  const submitReview = async (doctorId: string, rating: number, comment: string) => {
    if (!user) return;
    const { error } = await supabase.from('reviews').insert([{ doctor_id: doctorId, patient_id: user.id, rating, comment }]);
    if (!error) await fetchReviews();
  };

  const updateDoctorSettings = async (enabled: boolean, message: string, maxAppts: number) => {
    if (!user || user.role !== 'DOCTOR') return;
    const { error } = await supabase.from('doctors').update({ auto_reply_enabled: enabled, auto_reply_text: message, max_appointments_per_day: maxAppts }).eq('id', user.id);
    if (!error) {
        setUser(prev => prev ? ({ ...prev, autoReplyEnabled: enabled, autoReplyMessage: message, maxAppointmentsPerDay: maxAppts }) : null);
        fetchDoctors();
    }
  };

  const sendMessage = async (text: string, receiverId: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('messages').insert([{ sender_id: user.id, receiver_id: receiverId, content: text, is_auto_reply: false }]).select().single();
    if (!error && data) {
      setMessages(prev => [...prev, { id: data.id.toString(), senderId: data.sender_id, receiverId: data.receiver_id, content: data.content, createdAt: data.created_at, isAutoReply: false }]);
      if (user.role === 'PATIENT') {
        const doctor = doctors.find(d => d.id === receiverId);
        if (doctor && doctor.autoReplyEnabled) {
          setTimeout(async () => {
            const replyText = `[رد تلقائي] ${doctor.autoReplyMessage || 'أنا مشغول حالياً.'}`;
            const { data: replyData } = await supabase.from('messages').insert([{ sender_id: doctor.id, receiver_id: user.id, content: replyText, is_auto_reply: true }]).select().single();
            if (replyData) setMessages(prev => [...prev, { id: replyData.id.toString(), senderId: replyData.sender_id, receiverId: replyData.receiver_id, content: replyData.content, createdAt: replyData.created_at, isAutoReply: true }]);
          }, 1500);
        }
      }
    }
  };

  if (view === 'AUTH') return <Auth onLogin={handleLogin} onRegisterClick={() => setView('REGISTER_PATIENT')} onDoctorRegisterClick={() => setView('REGISTER_DOCTOR')} />;
  if (view === 'REGISTER_PATIENT') return <RegisterPatient onBack={() => setView('AUTH')} onSuccess={(data) => { setUser({ id: data.id.toString(), name: data.full_name, role: 'PATIENT' as UserRole, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=random` }); setView('APP'); }} />;
  if (view === 'REGISTER_DOCTOR') return <RegisterDoctor onBack={() => setView('AUTH')} onSuccess={(data) => { setUser({ id: data.id.toString(), name: data.full_name, role: 'DOCTOR' as UserRole, specialty: data.specialty, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=312e81&color=fff` }); setView('APP'); }} />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={() => { setUser(null); setView('AUTH'); }} />
      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-6xl">
        {user.role === 'PATIENT' ? <PatientDashboard appointments={appointments} doctors={doctorsWithRatings} onBook={addAppointment} onReview={submitReview} user={user} /> : <DoctorDashboard appointments={appointments} user={user} onUpdateStatus={updateAppointmentStatus} onUpdateSettings={updateDoctorSettings} />}
      </main>
      <ChatCenter user={user} messages={messages} contacts={chatContacts} onSendMessage={sendMessage} />
    </div>
  );
};

export default App;
                                                                             
