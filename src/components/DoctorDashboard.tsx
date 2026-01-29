import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';

interface DoctorDashboardProps {
  appointments: Appointment[];
  user: User;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onUpdateSettings: (enabled: boolean, message: string, maxAppts: number) => Promise<void>;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ appointments, user, onUpdateStatus, onUpdateSettings }) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(user.autoReplyEnabled || false);
  const [autoReplyMessage, setAutoReplyMessage] = useState(user.autoReplyMessage || '');
  const [maxAppointments, setMaxAppointments] = useState<number>(user.maxAppointmentsPerDay || 20);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (user) {
      setAutoReplyEnabled(user.autoReplyEnabled || false);
      setAutoReplyMessage(user.autoReplyMessage || 'أهلاً بك، أنا منشغل حالياً.');
      setMaxAppointments(user.maxAppointmentsPerDay || 20);
    }
  }, [user]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const stats = useMemo(() => {
    // نستخدم الحالات بالأحرف الكبيرة لتتطابق مع App.tsx الخاص بك
    const pending = appointments.filter(a => a.status === 'PENDING');
    const todays = appointments.filter(a => (a.status === 'ACCEPTED' || a.status === 'CONFIRMED') && a.date === todayStr);
    const allAccepted = appointments.filter(a => a.status === 'ACCEPTED' || a.status === 'CONFIRMED').length;
    return { pending, todays, allAccepted };
  }, [appointments, todayStr]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments);
      setSaveMessage({ text: 'تم الحفظ', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      setSaveMessage({ text: 'خطأ في الحفظ', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          
          {/* طلبات الحجز الجديدة */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">طلبات الحجز الجديدة ({stats.pending.length})</h3>
            {stats.pending.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">لا توجد طلبات جديدة</p>
            ) : (
              <div className="space-y-3">
                {stats.pending.map(appt => (
                  <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="font-bold">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.date} | {appt.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'REJECTED' as any)}
                        className="px-4 py-2 text-red-600 font-bold text-sm"
                      >
                        رفض
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'ACCEPTED' as any)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md"
                      >
                        قبول الموعد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* مواعيد اليوم المؤكدة */}
          <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-blue-800 mb-4">مواعيد اليوم المقبولة</h3>
            {stats.todays.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">لا توجد مواعيد مؤكدة لليوم</p>
            ) : (
              <div className="space-y-3">
                {stats.todays.map(appt => (
                  <div key={appt.id} className="p-4 bg-blue-50/50 rounded-2xl flex justify-between items-center">
                    <p className="font-bold">{appt.patientName} (الساعة: {appt.time})</p>
                    <button 
                      onClick={() => onUpdateStatus(appt.id, 'COMPLETED' as any)}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold"
                    >
                      إنهاء
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* قسم الإعدادات (إصلاح زر الرد التلقائي) */}
        <section className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">إعدادات العيادة</h3>
            
            <div className="space-y-6">
              {/* زر التبديل (Toggle) المصلح */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-700">الرد التلقائي</span>
                <div 
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${autoReplyEnabled ? 'translate-x-0' : '-translate-x-6'}`} />
                </div>
              </div>

              {autoReplyEnabled && (
                <textarea 
                  value={autoReplyMessage} 
                  onChange={(e) => setAutoReplyMessage(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm h-24"
                  placeholder="اكتب رسالة الرد..."
                />
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">أقصى عدد مواعيد يومياً</label>
                <input 
                  type="number" 
                  value={maxAppointments} 
                  onChange={(e) => setMaxAppointments(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <button 
                onClick={handleSaveSettings} 
                disabled={isSavingSettings}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
              >
                {isSavingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
              {saveMessage && <p className="text-center text-xs text-green-600 font-bold">{saveMessage.text}</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;
      
