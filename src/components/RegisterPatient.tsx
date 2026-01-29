import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface RegisterPatientProps {
  onBack: () => void;
  onSuccess: (userData: any) => void;
}

const ALGERIA_STATES = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", 
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", 
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة"
];

const RegisterPatient: React.FC<RegisterPatientProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    phone: '',
    state: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([
          { 
            full_name: formData.fullName, 
            password: formData.password,
            phone_number: formData.phone, 
            state: formData.state 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم إنشاء حسابك بنجاح! جاري تحويلك...' });
      setTimeout(() => {
        onSuccess(data);
      }, 2000);

    } catch (error: any) {
      setMessage({ type: 'error', text: 'حدث خطأ: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full space-y-6 border border-white/50 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل مريض جديد</h1>
          <p className="text-slate-500 text-sm">أدخل رقم هاتفك لإنشاء حسابك الطبي</p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium animate-in fade-in duration-300 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
            <input 
              type="text" required
              placeholder="مثال: محمد علي"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 mr-1">رقم الهاتف</label>
            <input 
              type="tel" required
              placeholder="05XXXXXXXX"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
            <input 
              type="password" required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 mr-1">الولاية</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
            >
              <option value="">اختر الولاية...</option>
              {ALGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'جاري التسجيل...' : 'إتمام التسجيل'}
          </button>
        </form>

        <button onClick={onBack} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
          العودة للدخول
        </button>
      </div>
    </div>
  );
};

export default RegisterPatient;
