import React, { useState, useMemo } from 'react';
import { Appointment, User } from '../types';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: User[];
  onBook: (appt: any) => Promise<boolean>;
  onReview: (doctorId: string, rating: number, comment: string) => Promise<void>;
  user: User;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ appointments, doctors, onBook, onReview, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [formData, setFormData] = useState({ date: '', queueNumber: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableSlots = Array.from({ length: 20 }, (_, i) => i + 1);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [doctors, searchQuery]);

  const isSlotBooked = (slot: number) => {
    if (!selectedDoctor || !formData.date) return false;
    return appointments.some(
      (a) => a.doctorId === selectedDoctor.id && 
             a.date === formData.date && 
             a.time === slot.toString() &&
             (a.status || '').toLowerCase() !== 'rejected'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !formData.date || !formData.queueNumber) return;
    setIsSubmitting(true);
    const success = await onBook({
      patientId: user.id,
      patientName: user.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: formData.date,
      time: formData.queueNumber,
      notes: formData.notes
    });
    setIsSubmitting(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowModal(false);
        setFormData({ date: '', queueNumber: '', notes: '' });
      }, 2000);
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <header className="border-b pb-6">
        <h2 className="text-2xl font-bold text-slate-800">مرحباً، {user.name}</h2>
        <p className="text-slate-500">مرحباً بك في لوحة تحكم المريض الخاصة بك.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-700">مواعيدك الحالية</h3>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">لا توجد مواعيد حالياً.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map(appt => {
                  // --- التعديل السحري هنا ---
                  // نقرأ الحالة ونحولها لحروف صغيرة ونتأكد من جميع الاحتمالات
                  const rawStatus = (appt.status || 'pending').toLowerCase(); 
                  const isAccepted = rawStatus === 'accepted' || rawStatus === 'confirmed';
                  // ---------------------------

                  return (
                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">{appt.time}</div>
                        <div>
                          <p className="font-bold text-slate-800">{appt.doctorName}</p>
                          <p className="text-sm text-slate-500">{appt.date}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors ${
                        isAccepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isAccepted ? 'تم القبول' : 'قيد الانتظار'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700">الأطباء المتاحون</h3>
          <input 
            type="text" 
            placeholder="بحث عن طبيب..." 
            className="w-full p-3 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="space-y-3">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{doc.name}</p>
                  <p className="text-xs text-blue-600 font-medium">{doc.specialty}</p>
                </div>
                <button 
                  onClick={() => { setSelectedDoctor(doc); setShowModal(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all"
                >
                  حجز موعد
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl">
            {showSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">✓</div>
                <h3 className="text-2xl font-bold text-slate-800">تم إرسال الطلب!</h3>
                <p className="text-slate-500 font-medium">سيقوم الطبيب بمراجعة موعدك قريباً.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">حجز موعد</h3>
                  <p className="text-slate-500 font-medium">مع الدكتور: {selectedDoctor?.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">التاريخ:</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                {formData.date && (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">رقم الدور المتاح:</label>
                    <div className="grid grid-cols-5 gap-2">
                      {availableSlots.map((slot) => {
                        const booked = isSlotBooked(slot);
                        return (
                          <button key={slot} disabled={booked} onClick={() => setFormData({ ...formData, queueNumber: slot.toString() })} className={`h-12 rounded-xl font-bold transition-all border ${booked ? 'bg-red-50 text-red-200 border-red-100 cursor-not-allowed' : formData.queueNumber === slot.toString() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button onClick={handleSubmit} disabled={isSubmitting || !formData.queueNumber} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all">
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الطلب الآن'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
