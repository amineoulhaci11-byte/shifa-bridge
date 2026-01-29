import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (role: UserRole, userData?: any) => void;
  onRegisterClick: () => void;
  onDoctorRegisterClick: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegisterClick, onDoctorRegisterClick }) => {
  const [step, setStep] = useState<'CHOICE' | 'PATIENT_LOGIN' | 'DOCTOR_LOGIN'>('CHOICE');
  const [phone, setPhone] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('patients')
        .select('*')
        .eq('phone_number', phone)
        .eq('password', patientPassword)
        .single();

      if (dbError || !data) throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة.');

      onLogin('PATIENT', {
        id: data.id.toString(),
        name: data.full_name,
        role: 'PATIENT',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=random`
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('doctors')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (dbError || !data) throw new Error('البريد أو كلمة المرور غير صحيحة.');

      onLogin('DOCTOR', {
        id: data.id.toString(),
        name: data.full_name,
        role: 'DOCTOR',
        specialty: data.specialty,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=312e81&color=fff`
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
        
        <div className="space-y-2">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">جسر الشفاء</h1>
          <p className="text-slate-500 text-sm">بوابتك الطبية الرقمية الآمنة</p>
        </div>

        {step === 'CHOICE' ? (
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setStep('PATIENT_LOGIN')}
              className="p-6 bg-slate-50 border-2 border-transparent hover:border-blue-500 rounded-2xl transition-all group"
            >
              <span className="text-lg font-bold text-slate-700 block">دخول كمريض</span>
              <span className="text-sm text-slate-400 group-hover:text-blue-500">بالهاتف وكلمة المرور</span>
            </button>

            <button 
              onClick={() => setStep('DOCTOR_LOGIN')}
              className="p-6 bg-slate-50 border-2 border-transparent hover:border-indigo-500 rounded-2xl transition-all group"
            >
              <span className="text-lg font-bold text-slate-700 block">دخول كطبيب</span>
              <span className="text-sm text-slate-400 group-hover:text-indigo-500">بالبريد وكلمة المرور</span>
            </button>
          </div>
        ) : step === 'PATIENT_LOGIN' ? (
          <form onSubmit={handlePatientLogin} className="space-y-4 text-right">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">رقم الهاتف</label>
              <input 
                type="tel" required autoFocus placeholder="05XXXXXXXX"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
              <input 
                type="password" required placeholder="••••••••"
                value={patientPassword} onChange={(e) => setPatientPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
              {loading ? 'جاري التحقق...' : 'دخول المريض'}
            </button>
            <button type="button" onClick={() => setStep('CHOICE')} className="w-full text-slate-400 text-sm">رجوع</button>
          </form>
        ) : (
          <form onSubmit={handleDoctorLogin} className="space-y-4 text-right">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</label>
              <input 
                type="email" required placeholder="doctor@mail.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
              <input 
                type="password" required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
              {loading ? 'جاري التحقق...' : 'دخول الطبيب'}
            </button>
            <button type="button" onClick={() => setStep('CHOICE')} className="w-full text-slate-400 text-sm">رجوع</button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-3">
          <button onClick={onRegisterClick} className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all">إنشاء حساب مريض</button>
          <button onClick={onDoctorRegisterClick} className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl font-bold hover:bg-indigo-100 transition-all">تسجيل طبيب متخصص</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
