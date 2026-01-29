import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: User[];
  onBook: (appt: Omit<Appointment, 'id' | 'status'> | Omit<Appointment, 'id' | 'status'>[]) => Promise<boolean>;
  onReview: (doctorId: string, rating: number, comment: string) => Promise<void>;
  user: User;
}

const generateDays = () => {
  const days = [];
  const start = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }
  return days;
};

const PatientDashboard: React.FC<PatientDashboardProps> = ({ appointments, doctors, onBook, onReview, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [formData, setFormData] = useState({ date: '', queueNumber: '', notes: '' });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDoctorId, setReviewDoctorId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortByRating, setSortByRating] = useState(false);

  const days = useMemo(() => generateDays(), []);
  const filteredDoctors = useMemo(() => {
    let result = doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
      const matchesState = selectedState ? doc.state === selectedState : true;
      return matchesSearch && matchesSpecialty && matchesState;
    });
    if (sortByRating) {
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [doctors, searchQuery, selectedSpecialty, selectedState, sortByRating]);

  const uniqueSpecialties = useMemo(() => Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean))) as string[], [doctors]);
  const uniqueStates = useMemo(() => Array.from(new Set(doctors.map(d => d.state).filter(Boolean))) as string[], [doctors]);
  const hasActiveFilters = searchQuery || selectedSpecialty || selectedState || sortByRating;

  const clearFilters = () => { setSearchQuery(''); setSelectedSpecialty(''); setSelectedState(''); setSortByRating(false); };
  const isQueueTaken = (date: string, number: number, doctorId: string) => {
    return appointments.some(a => a.date === date && a.time === number.toString() && a.doctorId === doctorId && a.status !== AppointmentStatus.REJECTED);
  };
  const formatDateLabel = (date: Date) => date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !formData.date || !formData.queueNumber) return;
    setIsSubmitting(true);
    const baseAppointment = { patientId: user.id, patientName: user.name, doctorId: selectedDoctor.id, doctorName: selectedDoctor.name, time: formData.queueNumber, notes: formData.notes };
    let appointmentsToBook = [];
    if (isRecurring) {
        const baseDate = new Date(formData.date);
        for (let i = 0; i < recurrenceWeeks; i++) {
            const nextDate = new Date(baseDate);
            nextDate.setDate(baseDate.getDate() + (i * 7));
            appointmentsToBook.push({ ...baseAppointment, date: nextDate.toISOString().split('T')[0] });
        }
    } else { appointmentsToBook.push({ ...baseAppointment, date: formData.date }); }
    const success = await onBook(appointmentsToBook);
    setIsSubmitting(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setShowModal(false); setFormData({ date: '', queueNumber: '', notes: '' }); setIsRecurring(false); setSelectedDoctor(null); }, 2000);
    }
  };

  const handleReviewSubmit = async () => {
      if (!reviewDoctorId || ratingValue === 0) return;
      await onReview(reviewDoctorId, ratingValue, reviewComment);
      setShowReviewSuccess(true);
      setTimeout(() => { setShowReviewSuccess(false); setShowReviewModal(false); setReviewDoctorId(null); setRatingValue(0); setReviewComment(''); }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مرحباً بك يا {user.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 italic">كيف يمكننا مساعدتك اليوم؟</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all transform hover:scale-105">+ حجز موعد جديد</button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-700 mb-4 text-right">مواعيدك القادمة</h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">لا توجد مواعيد حالية. ابدأ بحجز أول موعد لك!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map(appt => (
                  <div key={appt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-start gap-4 text-right">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 mt-1 sm:mt-0"><span className="font-bold text-lg">{appt.time}</span></div>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-lg">{appt.doctorName}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">{appt.date}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {appt.status === AppointmentStatus.COMPLETED ? (
                          <div className="flex items-center gap-2">
                            <span className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">تمت الزيارة</span>
                            <button onClick={() => { setReviewDoctorId(appt.doctorId); setShowReviewModal(true); }} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-xs font-bold hover:bg-yellow-200 transition-colors">⭐ قيّم تجربتك</button>
                          </div>
                      ) : (
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${appt.status === AppointmentStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {appt.status === AppointmentStatus.PENDING ? 'قيد الانتظار' : 'تم التأكيد'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700 text-right">الأطباء المتاحون</h3>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <input type="text" placeholder="ابحث عن طبيب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                    <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="">التخصص</option>{uniqueSpecialties.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="">الولاية</option>{uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
            </div>
            <div className="space-y-3">
                {filteredDoctors.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-800">{doc.name}</p>
                            <p className="text-xs text-blue-600">{doc.specialty}</p>
                        </div>
                        <button onClick={() => { setSelectedDoctor(doc); setShowModal(true); }} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100">حجز</button>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* نافذة الحجز */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            {showSuccess ? (
              <div className="py-12 text-center"><h3 className="text-2xl font-bold text-slate-800">تم الحجز بنجاح!</h3></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-right">
                <h3 className="text-xl font-bold text-slate-800 mb-4">حجز موعد مع {selectedDoctor?.name}</h3>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                <input type="number" placeholder="رقم الدور" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" value={formData.queueNumber} onChange={(e) => setFormData({...formData, queueNumber: e.target.value})} />
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold">{isSubmitting ? 'جاري الحجز...' : 'تأكيد الحجز'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نافذة التقييم */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative z-10 shadow-2xl">
            {showReviewSuccess ? (
              <div className="py-8 text-center"><h3 className="text-xl font-bold text-slate-800">شكراً لتقييمك!</h3></div>
            ) : (
              <div className="space-y-6 text-right">
                <h3 className="text-xl font-bold text-slate-800">تقييمك يهمنا</h3>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRatingValue(star)} className={`text-3xl ${star <= ratingValue ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>
                  ))}
                </div>
                <button onClick={handleReviewSubmit} disabled={ratingValue === 0} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">إرسال التقييم</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
        
