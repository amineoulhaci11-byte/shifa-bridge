import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './services/supabase';
import { UserRole, User, Appointment, AppointmentStatus, Message, Review } from './types';

// Components
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

  // ... (قم بنسخ منطق Fetch و Effects كما هو موجود في الكود الأصلي) ...
  // نظراً لطول الملف، تأكد من نسخ دوال fetchAppointments, fetchDoctors, وغيرها من الملف السابق.
  
  // يتبع باقي كود App.tsx ...
  // إذا كنت بحاجة للكود الكامل لـ App.tsx مرة أخرى أخبرني، لكنه مطابق لما لديك سابقاً.
  
  // (Render logic is standard)
  if (view === 'AUTH') {
    return <Auth 
      onLogin={handleLogin} 
      onRegisterClick={() => setView('REGISTER_PATIENT')} 
      onDoctorRegisterClick={() => setView('REGISTER_DOCTOR')}
    />;
  }
  
  // ... rest of render logic
  
  if (!user) { setView('AUTH'); return null; }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={() => { setUser(null); setView('AUTH'); }} />
      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-6xl">
        {user.role === 'PATIENT' ? (
          <PatientDashboard 
            appointments={appointments}
            doctors={doctorsWithRatings}
            onBook={addAppointment}
            onReview={submitReview}
            user={user}
          />
        ) : (
          <DoctorDashboard 
            appointments={appointments}
            user={user}
            onUpdateStatus={updateAppointmentStatus}
            onUpdateSettings={updateDoctorSettings}
          />
        )}
      </main>
      <ChatCenter user={user} messages={messages} contacts={chatContacts} onSendMessage={sendMessage} />
    </div>
  );
};

export default App;
