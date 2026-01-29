import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface RegisterDoctorProps {
  onBack: () => void;
  onSuccess: (userData: any) => void;
}

const ALGERIA_STATES = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", 
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", 
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "وهران"
];

const SPECIALTIES = [
  "طب عام", "طب الأطفال", "طب الأسنان", "طب العيون", "أمراض القلب", 
  "الأمراض الجلدية", "طب النساء والتوليد", "جراحة عامة", "طب الأعصاب", "أخرى"
];

const RegisterDoctor: React.FC<RegisterDoctorProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    specialty: '',
    phone: '',
    state: '',
    bio: '',
    locationUrl: '', 
    maxAppointments: 20 // الافتراضي
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'يرجى إدخال بريد إلكتروني صحيح (مثال: doctor@example.com)' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert([
          { 
            full_name: formData.fullName, 
            email: formData.email,
            password: formData.password,
            specialty: formData.specialty,
            phone_number: formData.phone, 
            state: formData.state,
            bio: formData.bio,
            clinic_location: formData.locationUrl,
            max_appointments_per_day: formData.maxAppointments
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم تسجيل حسابك المهني بنجاح!' });
      setTimeout(() => {
        onSuccess(data);
      }, 2000);

    } catch (error: any) {
      setMessage({ type: 'error', text: 'حدث خطأ: ' + (error.message || 'فشل الاتصال بقاعدة البيانات') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full space-y-6 border border-white/50 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">انضم كطبيب متخصص</h1>
          <p className="text-slate-500 text-sm">أنشئ ملفك المهني ببريدك الإلكتروني</p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
              <input 
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">التخصص</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              >
                <option value="">اختر التخصص...</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</label>
              <input 
                type="email" required
                placeholder="doctor@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
              <input 
                type="password" required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">رقم الهاتف</label>
              <input 
                type="tel" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">الولاية</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 appearance-none"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              >
                <option value="">الولاية...</option>
                {ALGERIA_STATES.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Location URL */}
               <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 mr-1 flex items-center gap-1">
                     رابط العيادة (Google Maps)
                     <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </label>
                  <input 
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left ltr"
                    style={{ direction: 'ltr' }}
                    value={formData.locationUrl}
                    onChange={(e) => setFormData({...formData, locationUrl: e.target.value})}
                  />
                </div>

                {/* Max Appointments */}
                <div className="space-y-1">
                   <label className="text-sm font-bold text-slate-700 mr-1">الحد الأقصى للمواعيد/يوم</label>
                   <input 
                      type="number" min="1" max="100"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                      value={formData.maxAppointments}
                      onChange={(e) => setFormData({...formData, maxAppointments: parseInt(e.target.value) || 20})}
                   />
                </div>
           </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 mr-1">نبذة مختصرة</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 h-20 resize-none"
              placeholder="تحدث بإيجاز عن خبراتك..."
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            ></textarea>
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري إنشاء الحساب...
              </>
            ) : 'إتمام التسجيل كطبيب'}
          </button>
        </form>

        <button onClick={onBack} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

export default RegisterDoctor;
