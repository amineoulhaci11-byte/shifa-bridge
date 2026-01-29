import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { getSmartResponse } from '../services/gemini';

interface ChatCenterProps {
  user: User;
  messages: Message[];
  contacts: User[];
  onSendMessage: (text: string, receiverId: string) => void;
}

const ChatCenter: React.FC<ChatCenterProps> = ({ user, messages, contacts, onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTypingAI, setIsTypingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current && isOpen && selectedContact) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTypingAI, isOpen, selectedContact]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedContact) return;
    
    const text = inputText;
    setInputText('');
    onSendMessage(text, selectedContact.id);

    // AI Simulation for "Smart Chat" feature
    if (text.includes('مساعد ذكي') || text.includes('نصيحة')) {
      setIsTypingAI(true);
      const aiReply = await getSmartResponse(text, user.role);
      setIsTypingAI(false);
      onSendMessage(`🤖 مساعد الشفاء الذكي: ${aiReply}`, user.id);
    }
  };

  const currentChatMessages = messages.filter(m => 
    (m.senderId === user.id && m.receiverId === selectedContact?.id) ||
    (m.senderId === selectedContact?.id && m.receiverId === user.id)
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Container - Handles positioning */}
      <div className={`fixed z-[100] font-sans transition-all duration-300 ${
          isOpen 
            ? 'inset-0 md:inset-auto md:bottom-6 md:left-6 flex flex-col items-end' 
            : 'bottom-6 left-6 flex flex-col items-end'
        }`} dir="rtl">

        {/* Chat Window */}
        {isOpen && (
          <div className="w-full h-full md:w-[360px] md:h-[500px] bg-white md:rounded-3xl shadow-none md:shadow-2xl border-none md:border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            
            {/* Header */}
            <div className="bg-blue-600 p-4 flex items-center justify-between text-white shadow-md z-10 shrink-0">
              {selectedContact ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedContact(null)} className="hover:bg-blue-500 p-1 rounded-lg transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={selectedContact.avatar} className="w-9 h-9 rounded-full border border-blue-300" alt="" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{selectedContact.name}</h3>
                      <p className="text-[10px] text-blue-100 opacity-90">{selectedContact.specialty || 'مريض'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-lg">الرسائل والاستشارات</h3>
                  <p className="text-xs text-blue-100 opacity-80">تواصل مع {user.role === 'PATIENT' ? 'طبيبك' : 'مرضاك'} بأمان</p>
                </div>
              )}
              <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white bg-blue-700/50 p-1.5 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-slate-50 relative">
              {!selectedContact ? (
                // Contacts List View
                <div className="h-full overflow-y-auto p-2">
                  {contacts.length > 0 ? (
                      contacts.map(contact => (
                      <button 
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-100 mb-2 active:scale-[0.98]"
                      >
                          <img src={contact.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                          <div className="text-right flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-base">{contact.name}</p>
                          <p className="text-sm text-slate-400 truncate">{contact.specialty || 'انقر لبدء المحادثة'}</p>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                             <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </div>
                      </button>
                      ))
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          <p className="text-base">لا توجد جهات اتصال متاحة حالياً.</p>
                      </div>
                  )}
                </div>
              ) : (
                // Chat Room View
                <div className="flex flex-col h-full">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="text-center py-2">
                       <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-bold shadow-sm">بداية المحادثة</span>
                    </div>
                    {currentChatMessages.map(msg => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-3.5 text-sm leading-relaxed shadow-sm ${
                            isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none rounded-2xl' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none rounded-2xl'
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {isTypingAI && (
                      <div className="flex justify-end">
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white border-t border-slate-100 safe-area-bottom">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="اكتب رسالة..."
                        className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-base text-slate-700 placeholder:text-slate-400 min-w-0"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`p-2.5 rounded-xl transition-all ${inputText.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                      >
                        <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Toggle Button - Hidden when chat is open on mobile */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`${isOpen ? 'hidden md:flex bg-red-500 hover:bg-red-600 rotate-90' : 'flex bg-blue-600 hover:bg-blue-700 hover:scale-110'} text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-900/20 items-center justify-center transition-all duration-300 ease-out z-[101] mt-4`}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <div className="relative">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </span>
            </div>
          )}
        </button>
      </div>
    </>
  );
};

export default ChatCenter;
