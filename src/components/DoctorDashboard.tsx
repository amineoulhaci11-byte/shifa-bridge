Import React, { useState, useEffect, useMemo } from 'react';
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
    const pending = appointments.filter(a => a.status === AppointmentStatus.PENDING);
    const todays = appointments.filter(a => a.status === AppointmentStatus.ACCEPTED && a.date === todayStr).sort((a, b) => parseInt(a.time) - parseInt(b.time));
    const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const allAccepted = appointments.filter(a => a.status === AppointmentStatus.ACCEPTED).length;
    return { pending, todays, completed, allAccepted };
  }, [appointments, todayStr]);

  const capacityPercent = Math.min(100, Math.round((stats.todays.length / maxAppointments) * 100));
  const isNearCapacity = capacityPercent >= 80;

  const handleSaveSettings = async () => {
    setIsSavingSettings(true); setSaveMessage(null);
    try {
      await onUpdateSettings(autoReplyEnabled, autoReplyMessage, maxAppointments);
      setSaveMessage({ text: 'تم حفظ الإعدادات بنجاح', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) { setSaveMessage({ text: `فشل الحفظ: ${error.message}`, type: 'error' }); } finally { setIsSavingSettings(false); }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">مرحباً د. {user.name.split(' ').slice(-1).join(' ')}</h2><p className="text-slate-500">لديك <span className="font-bold text-blue-600">{stats.todays.length}</span> مواعيد اليوم و <span className="font-bold text-amber-600">{stats.pending.length}</span> طلبات جديدة.</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[250px]"><div className="flex justify-between text-xs font-bold text-slate-600 mb-2"><span>سعة اليوم ({todayStr})</span><span className={isNearCapacity ? 'text-red-500' : 'text-blue-600'}>{stats.todays.length} / {maxAppointments}</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className={`h-2.5 rounded-full transition-all duration-1000 ${isNearCapacity ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${capacityPercent}%` }}></div></div>{isNearCapacity && <p className="text-[10px] text-red-500 mt-1 text-left">اقتربت من الحد الأقصى!</p>}</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div><h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">جدول مواعيد اليوم</h3>
             {stats.todays.length === 0 ? <div className="text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p>لا توجد مواعيد مجدولة لهذا اليوم.</p></div> : <div className="space-y-4">{stats.todays.map(appt => <div key={appt.id} className="p-4 border border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"><div className="flex items-center gap-4"><div className="bg-white p-3 rounded-xl shadow-sm text-center min-w-[80px]"><span className="block text-2xl font-black text-blue-600">{appt.time}</span><span className="text-[10px] text-slate-400">رقم الدور</span></div><div className="text-right"><p className="font-bold text-slate-800 text-lg">{appt.patientName}</p>{appt.notes && <p className="text-xs text-slate-500 mt-1 max-w-md truncate">{appt.notes}</p>}</div></div><button onClick={() => onUpdateStatus(appt.id, AppointmentStatus.COMPLETED)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2 min-w-[140px]">إنهاء الزيارة</button></div>)}</div>}
           </div>

          <div className="bg-white rounded-[2rem] border border-amber-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">طلبات الحجز الجديدة ({stats.pending.length})</h3>
            {stats.pending.length === 0 ? <div className="p-8 text-center text-slate-400">لا توجد طلبات معلقة حالياً.</div> : <div className="space-y-4">{stats.pending.map(appt => <div key={appt.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-4 text-right"><div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><p className="font-bold text-slate-800">{appt.patientName}</p><p className="text-xs text-slate-500 font-medium">{appt.date === todayStr ? 'اليوم' : appt.date} • الدور: {appt.time}</p>{appt.notes && <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate">{appt.notes}</p>}</div></div><div className="flex items-center gap-2"><button onClick={() => onUpdateStatus(appt.id, AppointmentStatus.REJECTED)} className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold transition-colors text-sm">رفض</button><button onClick={() => onUpdateStatus(appt.id, AppointmentStatus.ACCEPTED)} className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors shadow-lg shadow-blue-100 text-sm">قبول الموعد</button></div></div>)}</div>}
          </div>
        </section>

        <section className="space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm text-right"><h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">إعدادات العيادة</h3><div className="space-y-5"><div><label className="text-sm font-bold text-slate-600 block mb-2">الحد الأقصى للمواعيد اليومية</label><input type="number" min="1" max="100" value={maxAppointments} onChange={(e) => setMaxAppointments(Number(e.target.value))} className="w-full text-center font-bold text-lg p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" /><p className="text-[10px] text-slate-400 mt-1">لن يتمكن المرضى من الحجز في الأيام المكتملة.</p></div><div className="border-t border-slate-100 pt-4"><div className="flex items-center justify-between mb-2"><label className="text-sm font-bold text-slate-600">الرد التلقائي</label><div className="relative inline-block w-10 align-middle select-none"><input type="checkbox" checked={autoReplyEnabled} onChange={(e) => setAutoReplyEnabled(e.target.checked)} className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:bg-blue-600 right-0" style={{ right: autoReplyEnabled ? 'auto' : 0, left: autoReplyEnabled ? 0 : 'auto' }} /><div className={`block h-5 rounded-full w-10 ${autoReplyEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div></div></div>{autoReplyEnabled && <div className="mt-3"><textarea value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)} className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 resize-none" placeholder="اكتب الرسالة التلقائية هنا..." /></div>}</div><button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">{isSavingSettings ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>{saveMessage && <p className={`text-xs text-center font-medium p-2 rounded-lg mt-2 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{saveMessage.text}</p>}</div></div>
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100 text-right"><h3 className="font-bold mb-2">إحصائيات المنصة</h3><div className="grid grid-cols-2 gap-4 mt-4"><div className="bg-white/10 rounded-2xl p-3"><p className="text-xs opacity-70">إجمالي المواعيد</p><p className="text-xl font-bold">{appointments.length}</p></div><div className="bg-white/10 rounded-2xl p-3"><p className="text-xs opacity-70">المقبولة (الكلي)</p><p className="text-xl font-bold">{stats.allAccepted}</p></div><div className="bg-white/10 rounded-2xl p-3 col-span-2"><p className="text-xs opacity-70">تمت الزيارة</p><p className="text-xl font-bold">{stats.completed}</p></div></div></div>
        </section>
      </div>
    </div>
  );
};
export default DoctorDashboard;
