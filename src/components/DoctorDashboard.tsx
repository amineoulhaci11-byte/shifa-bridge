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
  const [autoReplyMessage, setAutoReplyMessage] = useState(user.autoReplyMessage || 'أهلاً بك، أنا منشغل حالياً وسأقوم بالرد عليك في أقرب وقت ممكن.');
  const [maxAppointments, setMaxAppointments] = useState<number>(user.maxAppointmentsPerDay || 20);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (user) {
      setAutoReplyEnabled(user.autoReplyEnabled || false);
      if (user.autoReplyMessage) setAutoReplyMessage(user.autoReplyMessage);
      if (user.maxAppointmentsPerDay) setMaxAppointments(user.maxAppointmentsPerDay);
    }
  }, [user.id, user.autoReplyEnabled, user.autoReplyMessage, user.maxAppointmentsPerDay]); 

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const stats = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'pending');
    const todays = appointments.filter(a => (a.status === 'accepted' || a.status === 'confirmed') && a.date === todayStr)
                               .sort((a, b) => parseInt(a.time) - parseInt(b.time));
    const completed = appointments.filter(a => a.status === 'completed').length;
    const allAccepted = appointments.filter(a => a.status === 'accepted' || a.status === 'confirmed').length;
    return { pending, todays, completed, allAccepted };
  }, [appointments, todayStr]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true); setSaveMessage(null);
    try {
      await onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments);
      setSaveMessage({ text: 'تم حفظ الإعدادات بنجاح', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) { setSaveMessage({ text: `فشل الحفظ: ${error.message}`, type: 'error' }); } finally { setIsSavingSettings(false); }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-right" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مرحباً د. {user.name}</h2>
          <p className="text-slate-500">لديك <span className="font-bold text-blue-600">{stats.todays.length}</span> مواعيد مؤكدة و <span className="font-bold text-amber-600">{stats.pending.length}</span> طلبات جديدة.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          {/* طلبات الحجز الجديدة */}
          <div className="bg-white rounded-[2rem] border border-amber-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">طلبات الحجز الجديدة ({stats.pending.length})</h3>
            {stats.pending.length === 0 ? (
              <div className="p-8 text-center text-slate-400">لا توجد طلبات معلقة حالياً.</div>
            ) : (
              <div className="space-y-4">
                {stats.pending.map(appt => (
                  <div key={appt.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.date} • الساعة: {appt.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateStatus(appt.id, 'rejected' as any)} className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">رفض</button>
                      {/* هنا التعديل الجوهري: نرسل 'accepted' ليتعرف عليها المريض */}
                      <button onClick={() => onUpdateStatus(appt.id, 'accepted' as any)} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">قبول</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* مواعيد اليوم */}
          <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">مواعيد اليوم المقبولة</h3>
            {stats.todays.length === 0 ? (
               <div className="text-center py-8 text-slate-400">لا توجد مواعيد مقبولة لليوم.</div>
            ) : (
              <div className="space-y-4">
                {stats.todays.map(appt => (
                  <div key={appt.id} className="p-4 border border-blue-50 bg-blue-50/30 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-blue-900">{appt.patientName}</p>
                      <span className="text-sm text-blue-600">الساعة: {appt.time}</span>
                    </div>
                    <button onClick={() => onUpdateStatus(appt.id, 'completed' as any)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold">إنهاء</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">إعدادات العيادة</h3>
            <div className="space-y-5">
              {/* زر التفعيل الذي كان مختفياً */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">تفعيل الرد التلقائي</span>
                <button 
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {autoReplyEnabled && (
                <textarea 
                  value={autoReplyMessage} 
                  onChange={(e) => setAutoReplyMessage(e.target.value)} 
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none"
                  placeholder="رسالة الرد التلقائي..."
                />
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">أقصى عدد مواعيد في اليوم</label>
                <input type="number" value={maxAppointments} onChange={(e) => setMaxAppointments(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                {isSavingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
              {saveMessage && <p className="text-xs text-center mt-2 text-green-600 font-bold">{saveMessage.text}</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;
                 
