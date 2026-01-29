import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';

interface DoctorDashboardProps {
  appointments: Appointment[];
  user: User;
  onUpdateStatus: (id: string, status: string) => void; // لاحظ: string لمرونة أكثر
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
    // === الحل السحري هنا ===
    // نقوم بتحويل الحالة لنص صغير (.toLowerCase) قبل المقارنة
    // هذا يضمن ظهور الموعد سواء كان PENDING أو pending
    const pending = appointments.filter(a => (a.status || '').toLowerCase() === 'pending');
    
    const today = new Date().toISOString().split('T')[0];
    const todays = appointments.filter(a => {
      const s = (a.status || '').toLowerCase();
      return (s === 'accepted' || s === 'confirmed') && a.date === today;
    });
    
    return { pending, todays };
  }, [appointments]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم الطلبات الجديدة */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">طلبات الحجز الجديدة</h3>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                {stats.pending.length} طلب
              </span>
            </div>
            
            {stats.pending.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400">لا توجد طلبات معلقة حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pending.map(appt => (
                  <div key={appt.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {appt.time}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{appt.patientName}</p>
                        <p className="text-xs text-slate-500 flex gap-2">
                          <span>📅 {appt.date}</span>
                          {appt.notes && <span className="text-amber-600 truncate max-w-[150px]">• {appt.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'rejected')} 
                        className="flex-1 sm:flex-none px-4 py-2 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm"
                      >
                        رفض
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(appt.id, 'accepted')} 
                        className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all text-sm"
                      >
                        قبول
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* قسم مواعيد اليوم المقبولة */}
          <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 mb-4">مواعيد اليوم المؤكدة ({stats.todays.length})</h3>
            {stats.todays.length === 0 ? (
               <p className="text-slate-400 text-center py-4">لا توجد مواعيد مجدولة لليوم</p>
            ) : (
              <div className="space-y-3">
                {stats.todays.map(appt => (
                  <div key={appt.id} className="p-4 bg-blue-50/50 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-bold text-slate-700">{appt.patientName}</span>
                    </div>
                    <button 
                      onClick={() => onUpdateStatus(appt.id, 'completed')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                    >
                      إنهاء الزيارة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* قسم الإعدادات (مع زر التفعيل المصلح) */}
        <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6 text-slate-800">إعدادات العيادة</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="font-bold text-sm text-slate-600">الرد التلقائي</span>
              <button 
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`w-12 h-6 flex items-center rounded-full px-1 transition-all duration-300 ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {autoReplyEnabled && (
              <div className="animate-in slide-in-from-top-2">
                <textarea 
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="اكتب رسالة الرد التلقائي..."
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">الحد الأقصى للمواعيد اليومية</label>
              <input 
                type="number" 
                min="1"
                value={maxAppointments}
                onChange={(e) => setMaxAppointments(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center outline-none focus:border-blue-500"
              />
            </div>

            <button 
              onClick={() => onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
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
            
