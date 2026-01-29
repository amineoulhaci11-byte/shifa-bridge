import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-lg">ج</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden xs:block">جسر الشفاء</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          
          <div className="text-left hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
            <p className="text-xs text-slate-400 leading-none mt-1">{user.role === 'DOCTOR' ? 'طبيب متخصص' : 'مريض'}</p>
          </div>
          
          <div className="flex items-center bg-slate-50 rounded-full p-1 pr-3 border border-slate-100">
             <span className="text-xs font-bold text-slate-700 ml-2 md:hidden truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
             <img src={user.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="Avatar" />
          </div>

          <button 
            onClick={onLogout} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors" 
            title="تسجيل الخروج"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
