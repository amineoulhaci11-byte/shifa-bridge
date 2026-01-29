      {/* نافذة التقييم - كانت مفقودة وهي سبب الخطأ */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            {showReviewSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <h3 className="text-xl font-bold text-slate-800">شكراً لتقييمك!</h3>
              </div>
            ) : (
              <div className="space-y-6 text-right">
                <h3 className="text-xl font-bold text-slate-800">تقييم الطبيب</h3>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRatingValue(star)} className={`text-3xl ${star <= ratingValue ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>
                  ))}
                </div>
                <textarea 
                  placeholder="اكتب تعليقك هنا..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 h-24 resize-none text-sm"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                ></textarea>
                <button 
                  onClick={handleReviewSubmit}
                  disabled={ratingValue === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  إرسال التقييم
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div> // إغلاق الوسم الرئيسي للمكون
  ); // إغلاق قوس الـ return
}; // إغلاق المكون

export default PatientDashboard; // تصدير المكون
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
  const renderStars = (rating: number = 0) => (
    <div className="flex items-center gap-0.5 text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
        ))}
        <span className="text-xs text-slate-500 font-medium mr-1">({rating.toFixed(1)})</span>
    </div>
  );

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
                            {appt.doctorLocation && <a href={appt.doctorLocation} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors border border-green-200">موقع العيادة</a>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">{appt.date}</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">الدور رقم: {appt.time}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {appt.status === AppointmentStatus.COMPLETED ? (
                          <div className="flex items-center gap-2"><span className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">تمت الزيارة</span><button onClick={() => { setReviewDoctorId(appt.doctorId); setShowReviewModal(true); }} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-xs font-bold hover:bg-yellow-200 transition-colors">⭐ قيّم تجربتك</button></div>
                      ) : (
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${appt.status === AppointmentStatus.PENDING ? 'bg-amber-100 text-amber-700' : appt.status === AppointmentStatus.ACCEPTED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${appt.status === AppointmentStatus.PENDING ? 'bg-amber-500' : appt.status === AppointmentStatus.ACCEPTED ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {appt.status === AppointmentStatus.PENDING ? 'قيد الانتظار' : appt.status === AppointmentStatus.ACCEPTED ? 'تم التأكيد' : 'تم الرفض'}
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
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-slate-700 text-right">الأطباء المتاحون</h3><span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-lg">{filteredDoctors.length} طبيب</span></div>
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative group"><input type="text" placeholder="ابحث عن اسم الطبيب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /></div>
            <div className="grid grid-cols-2 gap-2">
              <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"><option value="">كل التخصصات</option>{uniqueSpecialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}</select>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"><option value="">كل الولايات</option>{uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}</select>
            </div>
            <button onClick={() => setSortByRating(!sortByRating)} className={`w-full py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${sortByRating ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>الأعلى تقييماً</button>
            {hasActiveFilters && <button onClick={clearFilters} className="w-full text-center text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-xl font-medium transition-colors mt-2">مسح جميع التصنيفات</button>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDoctors.length === 0 ? <div className="col-span-full py-12 text-center text-slate-400"><p>لا يوجد أطباء مطابقين للبحث.</p></div> : 
              filteredDoctors.map(doc => (
                <div key={doc.id} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden flex flex-col h-full">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="relative"><img src={doc.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform" alt={doc.name} /><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full"></div></div>
                            <div className="bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg flex items-center gap-1"><span className="text-amber-600 font-bold text-xs">{doc.rating?.toFixed(1) || "0.0"}</span><svg className="w-3 h-3 text-amber-500 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg></div>
                        </div>
                        <div className="mb-4 flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{doc.name}</h3>
                            <p className="text-blue-600 text-sm font-medium mb-3">{doc.specialty}</p>
                            <div className="space-y-2">
                                {doc.state && <div className="flex items-center gap-2 text-slate-400 text-xs"><span>{doc.state}</span></div>}
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><span>{doc.reviewsCount || 0} تقييم</span></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            {doc.locationUrl && <a href={doc.locationUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg></a>}
                            <button onClick={() => { setSelectedDoctor(doc); setShowModal(true); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">حجز موعد</button>
                        </div>
                    </div>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            {showSuccess ? (
              <div className="py-12 text-center space-y-4"><h3 className="text-2xl font-bold text-slate-800">تم الطلب بنجاح!</h3></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-right">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4"><h3 className="text-xl font-bold text-slate-800">حجز موعد جديد</h3><button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">X</button></div>
                <div className="space-y-6">
                  <div><label className="block text-sm font-bold text-slate-700 mb-3">1. اختر الطبيب</label><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">{selectedDoctor && <div className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl border-2 border-blue-500 bg-blue-50 transition-all min-w-[200px]"><img src={selectedDoctor.avatar} className="w-10 h-10 rounded-xl" alt="" /><div className="text-right"><p className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{selectedDoctor.name}</p></div></div>}{filteredDoctors.filter(d => d.id !== selectedDoctor?.id).map(d => <button key={d.id} type="button" onClick={() => setSelectedDoctor(d)} className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-blue-200 transition-all"><img src={d.avatar} className="w-10 h-10 rounded-xl" alt="" /><div className="text-right"><p className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{d.name}</p></div></button>)}</div></div>
                  {selectedDoctor && <div><label className="block text-sm font-bold text-slate-700 mb-3">2. اختر التاريخ</label><div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{days.map(day => { const iso = formatISO(day); const isSelected = formData.date === iso; const isFull = appointments.filter(a => a.doctorId === selectedDoctor.id && a.date === iso && a.status !== AppointmentStatus.REJECTED).length >= (selectedDoctor.maxAppointmentsPerDay || 20); return <button key={iso} type="button" disabled={isFull} onClick={() => !isFull && setFormData({ ...formData, date: iso, queueNumber: '' })} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isFull ? 'bg-red-50 text-red-300' : isSelected ? 'bg-blue-600 text-white' : 'bg-white'}`}><span className="text-[10px] opacity-70 mb-1">{formatDateLabel(day).split(' ')[0]}</span><span className="text-sm font-bold">{day.getDate()}</span></button> })}</div></div>}
                  {formData.date && selectedDoctor && <div><label className="block text-sm font-bold text-slate-700 mb-3">3. اختر دورك</label><div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">{Array.from({ length: selectedDoctor.maxAppointmentsPerDay || 20 }, (_, i) => i + 1).map(num => { const isTaken = isQueueTaken(formData.date, num, selectedDoctor.id); const isSelected = formData.queueNumber === num.toString(); return <button key={num} type="button" disabled={isTaken} onClick={() => setFormData({ ...formData, queueNumber: num.toString() })} className={`py-2 rounded-xl border text-sm font-bold transition-all ${isTaken ? 'bg-slate-100 text-slate-300' : isSelected ? 'bg-blue-600 text-white' : 'bg-white'}`}>{num}</button> })}</div></div>}
                  {formData.date && formData.queueNumber && <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100"><div className="flex items-center justify-between"><label className="text-sm font-bold text-slate-700">تكرار هذا الموعد</label><input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-5 h-5" /></div>{isRecurring && <select value={recurrenceWeeks} onChange={(e) => setRecurrenceWeeks(Number(e.target.value))} className="mt-3 bg-white border border-slate-200 text-sm rounded-xl p-2"><option value={2}>أسبوعين</option><option value={3}>3 أسابيع</option><option value={4}>4 أسابيع</option></select>}</div>}
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات إضافية</label><textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 h-20 resize-none text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea></div>
                </div>
                <button type="submit" disabled={!selectedDoctor || !formData.date || !formData.queueNumber || isSubmitting} className="w-full py-4 rounded-2xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 disabled:opacity-50">{isSubmitting ? 'جاري الحجز...' : 'تأكيد حجز الموعد'}</button>
              </form>
            )}
          </div>
        </div>
      )}
      
  
