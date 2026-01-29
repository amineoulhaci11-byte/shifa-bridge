import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';

interface DoctorDashboardProps {
  appointments: Appointment[];
  user: User;
  onUpdateStatus: (id: string, status: string) => void;
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
    // نفلتر بناء على الأحرف الكبيرة
    const pending = appointments.filter(a => a.status === 'PENDING');
    const today = new Date().toISOString().split('T')[0];
    const todays = appointments.filter(a => (a.status === 'ACCEPTED' || a.status === 'CONFIRMED') && a.date === today);
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
                <div key={appt.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2 border border-slate-100 shadow-sm">
                  <div>
                    <p className="font-bold">{appt.patientName}</p>
                    <p className="text-xs text-slate-500">{appt.date} | {appt.time}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* إرسال الحالات بأحرف كبيرة صريحة */}
                    <button onClick={() => onUpdateStatus(appt.id, 'REJECTED')} className="text-red-500 font-bold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">رفض</button>
                    <button onClick={() => onUpdateStatus(appt.id, 'ACCEPTED')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all">قبول الموعد</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2rem] border shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6">إعدادات العيادة</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="font-bold text-sm">تفعيل الرد التلقائي</span>
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="اكتب رسالة الرد التلقائي هنا..."
              />
            )}

            <button 
              onClick={() => onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments)}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
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
