import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';

interface DoctorDashboardProps {
  appointments: Appointment[];
  user: User;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onUpdateSettings: (enabled: boolean, message: string, maxAppts: number) => Promise<void>;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ appointments, user, onUpdateStatus, onUpdateSettings }) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  const [maxAppointments, setMaxAppointments] = useState(20);

  useEffect(() => {
    if (user) {
      setAutoReplyEnabled(user.autoReplyEnabled || false);
      setAutoReplyMessage(user.autoReplyMessage || '');
      setMaxAppointments(user.maxAppointmentsPerDay || 20);
    }
  }, [user]);

  const stats = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'pending');
    const today = new Date().toISOString().split('T')[0];
    const todays = appointments.filter(a => (a.status === 'accepted' || a.status === 'confirmed') && a.date === today);
    return { pending, todays };
  }, [appointments]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
            <h3 className="text-lg font-bold mb-4">طلبات جديدة ({stats.pending.length})</h3>
            {stats.pending.length === 0 ? <p className="text-slate-400 text-center">لا توجد طلبات</p> : (
              stats.pending.map(appt => (
                <div key={appt.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2">
                  <div>
                    <p className="font-bold">{appt.patientName}</p>
                    <p className="text-xs text-slate-500">{appt.date} | {appt.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onUpdateStatus(appt.id, 'rejected' as any)} className="text-red-500 font-bold px-2">رفض</button>
                    <button onClick={() => onUpdateStatus(appt.id, 'accepted' as any)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">قبول الموعد</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2rem] border shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6">إعدادات العيادة</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">تفعيل الرد التلقائي</span>
              {/* زر تفعيل واضح جداً */}
              <button 
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`w-12 h-6 flex items-center rounded-full px-1 transition-all ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-all transform ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {autoReplyEnabled && (
              <textarea 
                value={autoReplyMessage}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm h-24"
                placeholder="رسالة الرد..."
              />
            )}

            <button 
              onClick={() => onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              حفظ الإعدادات
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;
