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
    // التصفية هنا تدعم الحالات الصغيرة والكبيرة لضمان عدم ضياع أي موعد
    const pending = appointments.filter(a => a.status.toLowerCase() === 'pending');
    const todays = appointments.filter(a => 
      (a.status.toLowerCase() === 'accepted' || a.status.toLowerCase() === 'confirmed') && a.date === todayStr
    );
    return { pending, todays };
  }, [appointments, todayStr]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments);
      setSaveMessage({ text: 'تم حفظ الإعدادات', type: 'success' });
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
            <h3 className="text-lg font-bold mb-4 text-slate-800">الطلبات الجديدة ({stats.pending.length})</h3>
            {stats.pending.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">لا توجد طلبات بانتظار الرد</p>
            ) : (
              <div className="space-y-3">
                {stats.pending.map(appt => (
                  <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.date} | {appt.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'rejected' as any)}
                        className="px-4 py-2 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl"
                      >
                        رفض
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'accepted' as any)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700"
                      >
                        قبول
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* جدول اليوم */}
          <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-blue-800 mb-4">مواعيد اليوم المقبولة ({stats.todays.length})</h3>
            {stats.todays.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">لا توجد مواعيد مقبولة لليوم بعد</p>
            ) : (
              <div className="space-y-3">
                {stats.todays.map(appt => (
                  <div key={appt.id} className="p-4 bg-blue-50/50 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-blue-900">{appt.patientName}</p>
                      <p className="text-xs text-blue-600">الساعة: {appt.time}</p>
                    </div>
                    <button 
                      onClick={() => onUpdateStatus(appt.id, 'completed' as any)}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700"
                    >
                      إنهاء الزيارة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* قسم الإعدادات */}
        <section className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-800">إعدادات العيادة</h3>
            <div className="space-y-6">
              
              <div className="flex items-center justify-between p-1">
                <span className="font-bold text-sm text-slate-700">تفعيل الرد التلقائي</span>
                <button 
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {autoReplyEnabled && (
                <textarea 
                  value={autoReplyMessage} 
                  onChange={(e) => setAutoReplyMessage(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="اكتب رسالة الرد التلقائي..."
                />
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">أقصى عدد مواعيد يومياً</label>
                <input 
                  type="number" 
                  value={maxAppointments} 
                  onChange={(e) => setMaxAppointments(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button 
                onClick={handleSaveSettings} 
                disabled={isSavingSettings}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
              {saveMessage && <p className={`text-center text-xs font-bold ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{saveMessage.text}</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;
                        
